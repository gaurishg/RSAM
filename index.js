$(document).ready(function () {
    const GEOSERVER_ADDR_LOCAL = 'http://localhost:8080/geoserver/ir/wms';
    const GEOSERVER_ADDR_C9 = 'http://ubuntu-gaurish.c9users.io/geoserver/ir/wms';
    var GeoServerAddress = GEOSERVER_ADDR_LOCAL;
    var API_SERVER_URL = 'http://localhost:5000'

    function formObjectBuilder(form) // e.g. "#formid", "form" etc
    {
        var form_data_as_array = $(form).serializeArray();
        var form_data = {};
        for (var i = 0; i < form_data_as_array.length; ++i) {
            var field = form_data_as_array[i];
            if (field.value === 'No_Select') {
                continue;
            }
            if (form_data[field.name] === undefined) {
                form_data[field.name] = [field.value];
            }
            else {
                form_data[field.name].push(field.value);
            }
        }

        return form_data;
    } // function formObjectBuilder ends

    function myQueryBuilder() {
        var query = null;

        var form_data_object = formObjectBuilder("form");
        for (var filter_name in form_data_object) {
            if (form_data_object.hasOwnProperty(filter_name)) {
                // Get filter values as array
                var filter_values = form_data_object[filter_name];
                // if (filter_name === "station_category")
                //     filter_name = "category";
                // if (filter_name === "station_zone")
                //     filter_name = "idzone";
                // if (filter_name === "station_division")
                //     filter_name = "iddivision";

                // Enter first element of array
                if (query === null) {
                    query = "(" + String(filter_name) + "=" + "'" + filter_values[0] + "'";
                }
                else {
                    query += " AND (" + String(filter_name) + "=" + "'" + filter_values[0] + "'";
                }

                // Enter next values of array
                for (var i = 1; i < filter_values.length; ++i) {
                    query += " OR " + String(filter_name) + "=" + "'" + filter_values[i] + "'";
                }

                query += ")";
            }
        }


        console.log(query);
        return query;
    }// function myQueryBuilder ends

    function onFormDataChanged(event) {
        var cql = myQueryBuilder();
        stations_layer.getSource().params_.CQL_FILTER = cql;
        stations_layer.getSource().updateParams(stations_layer.getSource().getParams());
    }

    var main_row = document.querySelector("#main_row");

    var main_row_height = main_row.offsetHeight;

    var map = document.querySelector("#map");
    var map_heigth = map.offsetHeight;

    if (map_heigth <= main_row_height && main_row_height >= 400) {
        map.style.height = main_row_height + "px";
    }

    function createZoneOption(text) {
        var option = document.createElement("option");
        var select = document.querySelector("#zone_select");
        var textNode = document.createTextNode(text);

        option.setAttribute("value", text);
        option.appendChild(textNode);
        select.appendChild(option);
    }

    function createDivisionCheckboxes(divisions){
        for(var i=0; i<divisions.length; ++i)
        {
            var checkBoxesRow = document.querySelector("#division_checkboxes");
            var division = divisions[i];
            var division_code = division["division_code"];
            var div = document.createElement("div");
            $(div).addClass("form-check");
            $(div).addClass("form-check-inline");
            $(div).addClass("col-5");
            $(div).addClass("col-sm-4");
            $(div).addClass("col-md-3");
            $(div).addClass("col-lg-2");

            var input = document.createElement("input");
            $(input).addClass("form-check-input");
            input.setAttribute("id", "division_"+division_code);
            input.setAttribute("name", "division_code");
            input.setAttribute("type", "checkbox");
            input.setAttribute("value", division_code);

            var label = document.createElement("label");
            $(label).addClass("form-check-label");
            label.setAttribute("for", "division_"+division_code);

            var textNode = document.createTextNode(division_code);

            checkBoxesRow.appendChild(div);
            div.appendChild(input);
            div.appendChild(label);
            label.appendChild(textNode);

            input.addEventListener("change", onFormDataChanged);
        }
    }

    // Populate zones
    $.ajax({
        dataType: 'json',
        method: 'GET',
        url: API_SERVER_URL + '/zones/',
        // crossDomain: true,
        beforeSend: function () {
            // console.log("Before sending Ajax request");
        },

        complete: function (result) {
            // console.log("After completion of ajax request");
            // console.log(result.responseText);
            // console.log(result);
            // console.log(typeof result.responseText)
            var zones = $.parseJSON(result.responseText);
            for (var i = 0; i < zones.length; ++i) {
                var zone = zones[i];
                createZoneOption(zone['zone_code']);
            }
        },

    });
    // $.getJSON(API_SERVER_URL + '/zones/', function(result){
    //     console.log(API_SERVER_URL + '/zones/', ' called');
    //     console.log(result);
    //     for(var i=0; i<result.length; ++i)
    //     {
    //         var zone_data = result[i];
    //         createZoneOption(zone_data['zone_code'])
    //     }
    // })

    var osmLayer = new ol.layer.Tile({
        title: "OpenStreetMap",
        type: 'base',
        source: new ol.source.OSM()
    });

    var bhuvanLayer = new ol.layer.Tile({
        title: "Bhuvan",
        type: 'base',
        source: new ol.source.TileWMS({
            url: "http://bhuvan3.nrsc.gov.in/cgi-bin/LULC250K.exe",
            params:
            {
                layers: "LULC250K_1617",
                CQL_FILTER: null,
            }
        })
    });

    var stations_layer = new ol.layer.Tile({
        title: "Railway Stations",
        source: new ol.source.TileWMS({
            url: GeoServerAddress,
            params: {
                layers: "ir:stations_view",
                CQL_FILTER: null,

            },
            crossOrigin: 'anonymous',
        }),
        // opacity: 0.5,
    });

    var art_layer = new ol.layer.Tile({
        title: "ARTs",
        source: new ol.source.TileWMS({
            url: GeoServerAddress,
            params: {
                layers: "ir:Accident_Relief_Trains",

            }
        }),
        //   opacity = 0.8,
    });

    var railways_layer_group = new ol.layer.Tile({
        title: 'Stations_and_ARTs',
        source: new ol.source.TileWMS({
            url: GeoServerAddress,
            params: {
                layers: "ir:railways"
            }
        })
    });

    var secupoly_layer = new ol.layer.Tile({
        title: "SC Station Area",
        source: new ol.source.TileWMS({
            url: GeoServerAddress,
            params: {
                layers: "ir:secupoly",
            }
        })
    });


    var filterParams = {
        'FILTER': null,
        'CQL_FILTER': null,
        'FEATUREID': null
    };


    var map = new ol.Map({
        target: 'map',
        layers: [
            osmLayer,
            // bhuvanLayer,

            secupoly_layer,
            stations_layer,
            art_layer,

        ],
        // overlays: [overlay],
        view: new ol.View({
            center: ol.proj.fromLonLat([82.41, 18.82]),
            zoom: 6
        })
    });

    map.addControl(new ol.control.LayerSwitcher());

    // Add listener on map
    map.on('singleclick', function (evt) {
        // document.getElementById('nodelist_stations').innerHTML = "Loading... please wait...";
        var view = map.getView();
        var viewResolution = view.getResolution();
        // document.querySelector("#details-div").style.zIndex = "1";
        // var row = document.createElement('div');
        // row.setAttribute('class', 'row');
        // document.body.appendChild(row);

        // Stations
        var source = stations_layer.getSource();
        var url = source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, view.getProjection(),
            { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50, 'QUERY_LAYERS': ['stations_view',] });
        if (url) {
            // console.log(url);
            $.getJSON(url, function (result) {
                var station_details_element = document.querySelector("#station_details");
                station_details_element.innerHTML = '<div class="row"><div class="col"><h4>Stations</h4></div></div>';
                if (result.numberReturned > 0) {
                    // console.log(result);
                    document.querySelector("#details-div").style.zIndex = "1";
                    // Add heading station
                    var station_details_element = document.querySelector("#station_details");
                    var table = document.createElement("table");
                    table.setAttribute("class", "table table-striped table-light");
                    table.setAttribute("id", "station_details_table");
                    var thead = document.createElement("thead");
                    var tr = document.createElement("tr");

                    station_details_element.appendChild(table);
                    table.appendChild(thead);
                    thead.appendChild(tr);
                    
                    var th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    $(th).addClass("thead-dark");
                    var textNode = document.createTextNode("Sr.No.");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Name");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Code");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Division");
                    th.appendChild(textNode);
                    tr.appendChild(th);
                    
                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Zone");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("State");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Category");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    var tbody = document.createElement("tbody");
                    table.appendChild(tbody);
                    for(var i=0; i<result.numberReturned; ++i)
                    {
                        var station = result.features[i].properties;
                        tr = document.createElement("tr");
                        tbody.appendChild(tr);

                        textNode = document.createTextNode((i + 1));
                        th = document.createElement("th");
                        th.setAttribute("scope", "row");
                        th.appendChild(textNode);
                        tr.appendChild(th);

                        textNode = document.createTextNode(station['name']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);

                        textNode = document.createTextNode(station['code']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);
                        
                        textNode = document.createTextNode(station['division_name']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);
                        
                        textNode = document.createTextNode(station['zone_code']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);
                        
                        textNode = document.createTextNode(station['state_name']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);

                        textNode = document.createTextNode(station['category']);
                        th = document.createElement("td");
                        th.appendChild(textNode);
                        tr.appendChild(th);
                    }
                } // if(result.numberReturned > 0) ends
                else
                {
                    document.querySelector("#details-div").style.zIndex = "0";
                }

            })
            //   document.getElementById('nodelist_stations').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        }

        // ARTs
        source = art_layer.getSource();
        url = source.getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(),
            { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50, 'QUERY_LAYERS': ['Accident_Relief_Trains'] });
        if (url) {
            // console.log(url);
            $.getJSON(url, function (result) {
                var art_details_element = document.querySelector("#art_details");
                art_details_element.innerHTML = '';
                if (result.numberReturned > 0) {
                    document.querySelector("#details-div").style.zIndex = "1";
                    // console.log(result)
                    // console.log(typeof(result))
                    // Add row to show heading ARTs
                    var row = document.createElement("div");
                    $(row).addClass("row");
                    var col = document.createElement("div");
                    $(col).addClass("col");
                    var heading = document.createElement("h4");
                    var textNode = document.createTextNode("ARTs");
                    art_details_element.appendChild(row);
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    // Add headers
                    var table = document.createElement("table");
                    $(table).addClass("table table-striped table-light");
                    table.setAttribute("id", "art_details_table");
                    var thead = document.createElement("thead");
                    var tr = document.createElement("tr");

                    art_details_element.appendChild(table);
                    table.appendChild(thead);
                    thead.appendChild(tr);
                    
                    var th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    var textNode = document.createTextNode("Sr.No.");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Zone");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Division");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    th = document.createElement("th");
                    th.setAttribute("scope", "col");
                    textNode = document.createTextNode("Type");
                    th.appendChild(textNode);
                    tr.appendChild(th);

                    var tbody = document.createElement("tbody");
                    table.appendChild(tbody);
                    for(var i=0; i<result.numberReturned; ++i)
                    {
                        var art = result.features[i].properties;
                        tr = document.createElement("tr");
                        tbody.appendChild(tr);

                        textNode = document.createTextNode((i + 1));
                        th = document.createElement("th");
                        th.setAttribute("scope", "row");
                        th.appendChild(textNode);
                        tr.appendChild(th);

                        textNode = document.createTextNode(art['Zone']);
                        var td = document.createElement("td");
                        td.appendChild(textNode);
                        tr.appendChild(td);

                        textNode = document.createTextNode(art['Division']);
                        td = document.createElement("td");
                        td.appendChild(textNode);
                        tr.appendChild(td);
                        
                        var art_type = null;
                        if(art["ARME_Scale"] === "Y")
                        {
                            art_type = art["SPART_Conv"]==="SPART"?"SPARMV":"Conventional ARMV";
                        }
                        else
                        {
                            art_type = "Class " + art["Class"] + " ART";
                        }
                        textNode = document.createTextNode(art_type);
                        td = document.createElement("td");
                        td.appendChild(textNode);
                        tr.appendChild(td);
                    }
                }
                else
                {
                    document.querySelector("#details-div").style.zIndex = "0";
                }


            })
            // document.querySelector("#nodelist_ARTs").innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        }
    });


    // Add event listeners for all checkboxes
    document.querySelectorAll("input[type=checkbox]").forEach(function (checkbox, index) {
        checkbox.addEventListener("change", onFormDataChanged);
    });

    // Add event listener to select box for zones
    document.querySelector("#zone_select").addEventListener("change", function(event){
        document.querySelector("#division_checkboxes").innerHTML = "";
        onFormDataChanged();
        $.ajax({
            dataType: 'json',
            method: 'GET',
            url: API_SERVER_URL + '/divisions/' + event.target.value,
            complete: function(result)
            {
                // console.log(result.responseText);
                var divisions = JSON.parse(result.responseText);
                // console.log(divisions);
                createDivisionCheckboxes(divisions);
            }
        })
    });

    // Add event listener to details close button
    document.querySelector("#details-div-close").addEventListener("click", function(event){
        document.querySelector("#details-div").style.zIndex = "0";
    })
})