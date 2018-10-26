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
            zoom: 5
        })
    });

    map.addControl(new ol.control.LayerSwitcher());

    // Add listener on map
    map.on('singleclick', function (evt) {
        // document.getElementById('nodelist_stations').innerHTML = "Loading... please wait...";
        var view = map.getView();
        var viewResolution = view.getResolution();
        // var row = document.createElement('div');
        // row.setAttribute('class', 'row');
        // document.body.appendChild(row);

        // Stations
        var source = stations_layer.getSource();
        var url = source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, view.getProjection(),
            { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50, 'QUERY_LAYERS': ['stations_view',] });
        if (url) {
            console.log(url);
            $.getJSON(url, function (result) {
                var station_details_element = document.querySelector("#station_details");
                station_details_element.innerHTML = '';
                if (result.numberReturned > 0) {
                    console.log(result);

                    // Add heading station
                    var row = document.createElement("div");
                    $(row).addClass("row");
                    $(row).addClass("align-items-center");
                    var col = document.createElement("div");
                    $(col).addClass("col").addClass("align-self-center");
                    var heading = document.createElement("h4");
                    var textNode = document.createTextNode("Stations");

                    station_details_element.appendChild(row);
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    // Add headers
                    row = document.createElement("div");
                    $(row).addClass("row");
                    station_details_element.appendChild(row);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Sr.No.");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Name");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Code");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Division");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Zone");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Category");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    textNode = document.createTextNode("Cleaning Contract by ENHM");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(textNode);

                    for (var i = 0; i < result.numberReturned; ++i) {
                        var feature = result.features[i].properties;
                        console.log(feature);
                        row = document.createElement("div");
                        $(row).addClass("row");
                        // $(row).addClass("align-items-center")
                        station_details_element.appendChild(row);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(i + 1);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['name']);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['code']);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['division_name']);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['zone_code']);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['category']);
                        row.appendChild(col);
                        col.appendChild(textNode);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        textNode = document.createTextNode(feature['cleaning_contract_by_enhm'] ? "Yes" : "NO");
                        row.appendChild(col);
                        col.appendChild(textNode);
                    }
                } // if(result.numberReturned > 0) ends

            })
            //   document.getElementById('nodelist_stations').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        }

        // ARTs
        source = art_layer.getSource();
        url = source.getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(),
            { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 50, 'QUERY_LAYERS': ['Accident_Relief_Trains'] });
        if (url) {
            console.log(url);
            $.getJSON(url, function (result) {
                var art_details_element = document.querySelector("#art_details");
                art_details_element.innerHTML = '';
                if (result.numberReturned > 0) {
                    // console.log(result)
                    // console.log(typeof(result))
                    // Add row to show heading ARTs
                    var row = document.createElement("div");
                    $(row).addClass("row");
                    var col = document.createElement("div");
                    $(col).addClass("col");
                    var heading = document.createElement("h4");
                    var text = document.createTextNode("ARTs");
                    art_details_element.appendChild(row);
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(text);

                    // Add headers
                    row = document.createElement("div");
                    $(row).addClass("row");
                    art_details_element.appendChild(row);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    text = document.createTextNode("Sr.No.");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(text);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    text = document.createTextNode("Zone");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(text);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    text = document.createTextNode("Division");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(text);

                    col = document.createElement("div");
                    $(col).addClass("col");
                    heading = document.createElement("h5");
                    text = document.createTextNode("Type");
                    row.appendChild(col);
                    col.appendChild(heading);
                    heading.appendChild(text);

                    for (var i = 0; i < result.numberReturned; ++i) {
                        var feature = result.features[i].properties;
                        console.log(feature);
                        row = document.createElement("div");
                        $(row).addClass("row");
                        art_details_element.appendChild(row);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        text = document.createTextNode(i + 1);
                        row.appendChild(col);
                        col.appendChild(text);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        text = document.createTextNode(feature['Zone']);
                        row.appendChild(col);
                        col.appendChild(text);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        text = document.createTextNode(feature['Division']);
                        row.appendChild(col);
                        col.appendChild(text);

                        col = document.createElement("div");
                        $(col).addClass("col");
                        var textContent = null;
                        var arme_scale_i = feature['ARME_Scale'];
                        if (arme_scale_i == 'N') {
                            textContent = feature['Class'] + " Class ART";
                        }
                        else {
                            textContent = feature['SPART_Conv'] + " ARMV";
                        }
                        text = document.createTextNode(textContent);
                        row.appendChild(col);
                        col.appendChild(text);
                    }
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
})