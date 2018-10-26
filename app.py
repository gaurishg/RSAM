from flask import Flask, make_response, request, current_app 
from flask_cors import CORS
import psycopg2
import json

connection = psycopg2.connect("user=postgres dbname=railwaydb password=password")
cursor = connection.cursor()

app = Flask(__name__)
CORS(app)

# def crossdomain(origin=None, methods=None, headers=None, max_age=21600, attach_to_all=True, automatic_options=True):  
#     if methods is not None:
#         methods = ', '.join(sorted(x.upper() for x in methods))
#     if headers is not None and not isinstance(headers, basestring):
#         headers = ', '.join(x.upper() for x in headers)
#     if not isinstance(origin, basestring):
#         origin = ', '.join(origin)
#     if isinstance(max_age, timedelta):
#         max_age = max_age.total_seconds()

#     def get_methods():
#         if methods is not None:
#             return methods

#         options_resp = current_app.make_default_options_response()
#         return options_resp.headers['allow']

#     def decorator(f):
#         def wrapped_function(*args, **kwargs):
#             if automatic_options and request.method == 'OPTIONS':
#                 resp = current_app.make_default_options_response()
#             else:
#                 resp = make_response(f(*args, **kwargs))
#             if not attach_to_all and request.method != 'OPTIONS':
#                 return resp

#             h = resp.headers

#             h['Access-Control-Allow-Origin'] = origin
#             h['Access-Control-Allow-Methods'] = get_methods()
#             h['Access-Control-Max-Age'] = str(max_age)
#             if headers is not None:
#                 h['Access-Control-Allow-Headers'] = headers
#             return resp

#         f.provide_automatic_options = False
#         return update_wrapper(wrapped_function, f)
#     return decorator


@app.route('/zones/')
# @crossdomain(origin='*')
def zones():
    cursor.execute("SELECT idzone, zone_code, zone_name, zonal_hq from zones")
    zones = cursor.fetchall()
    zones_dict_list = []
    for z in zones:
        zones_dict_list.append(
            {
            'idzone': str(z[0]),
            'zone_code': str(z[1]),
            'zone_name': str(z[2]),
            'zonal_hq': str(z[3])
            })
    return json.dumps(zones_dict_list)


@app.route('/divisions/')
# @crossdomain(origin='*')
def divisions():
    cursor.execute("SELECT iddivision, division_code, division_name, idzone, zone_code, zone_name FROM divisions NATURAL JOIN zones")
    divisions = cursor.fetchall()
    div_dict_list = []
    for d in divisions:
        div_dict_list.append({
            'iddivision': d[0],
            'division_code': d[1],
            'division_name': d[2],
            'idzone': d[3],
            'zone_code': d[4],
            'zone_name': d[5],
        })
    return json.dumps(div_dict_list)

@app.route('/divisions/<int:idzone>')
# @crossdomain(origin='*')
def divisions_by_zone_id(idzone):
    cursor.execute("SELECT iddivision, division_code, division_name, idzone, zone_code, zone_name FROM divisions NATURAL JOIN zones WHERE idzone=%s", (idzone,))
    divisions = cursor.fetchall()
    div_dict_list = []
    for d in divisions:
        div_dict_list.append({
            'iddivision': d[0],
            'division_code': d[1],
            'division_name': d[2],
            'idzone': d[3],
            'zone_code': d[4],
            'zone_name': d[5],
        })
    return json.dumps(div_dict_list)


@app.route('/divisions/<string:zone_code>')
# @crossdomain(origin='*')
def divisions_by_zone_code(zone_code):
    cursor.execute("SELECT iddivision, division_code, division_name, idzone, zone_code, zone_name FROM divisions NATURAL JOIN zones WHERE zone_code=%s", (zone_code,))
    divisions = cursor.fetchall()
    div_dict_list = []
    for d in divisions:
        div_dict_list.append({
            'iddivision': d[0],
            'division_code': d[1],
            'division_name': d[2],
            'idzone': d[3],
            'zone_code': d[4],
            'zone_name': d[5],
        })
    return json.dumps(div_dict_list)