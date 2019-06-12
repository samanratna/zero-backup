from flask import Flask, render_template
app = Flask(__name__)

i = 1


@app.route('/')
def index():
    print(i)
    return render_template("index.html", name="Joe")


if __name__ == "__main__":
    app.run(debug=True)
#
# import sys
#
# from flask import Flask, render_template, request, redirect, Response
# import random
# import json
#
# app = Flask(__name__)
#
#
# @app.route('/')
# def output():
#     # serve index template
#     return render_template('index.html', name='Joe')
#
#
# @app.route('/receiver', methods=['POST'])
# def worker():
#     # read json + reply
#     data = request.get_json()
#     result = ''
#
#     for item in data:
#         # loop over every row
#         result += str(item['make']) + '\n'
#
#     return result
#
#
# if __name__ == '__main__':
#     # run!
#     app.run()