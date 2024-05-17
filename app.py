from flask import Flask, stream_with_context,request, Response, jsonify, render_template # These are all we need for our purposes
import json
from flask import url_for
from pydantic import BaseModel, ValidationError
from flask_cors import CORS
import torch
import ast
import time
from typing import List
import logging
import sys
import os

app = Flask(__name__, static_folder="client/dist")
app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.ERROR)

CORS(app, resources={r'/*': {'origins': '*'}})


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return app.send_static_file(path)

class ConfigData():
    def __init__(self, data) -> None:
        self.learningRate:float = float(data['learningRate'])
        self.numLinks:int = int(data['numLinks'])
        self.maxIteration:int = int(data['maxIteration'])
        self.errorThreshold:float = float(data['errorThreshold'])
        self.lossFunction:int = int(data['lossFunction'])
        self.optimizer:int = int(data["optimizer"])
        self.linkLengths: List[float] = data['linkLengths']
        self.initialAngles: List[float] = data['initialAngles']
        self.target: List[float] = data['target']
            


@app.route("/api/simulate")
def simulate():
    config = request.args.get('config')
    print(config)
    try:
        data = ConfigData(json.loads(config))
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON format", "details": str(e)}), 400
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400
    # Use the validated data
    print("Learning Rate:", data.learningRate)
    print("Number of Links:", data.numLinks)
    print("Max Iteration:", data.maxIteration)
    print("Error Threshold:", data.errorThreshold)
    print("Loss Function:", data.lossFunction)
    print("Link Lengths:", data.linkLengths)
    print("Joint Angles:", data.initialAngles)
    print("Target Position:", data.target)

    link_lengths = torch.Tensor(data.linkLengths).unsqueeze(1)
    joint_angles = torch.Tensor(data.initialAngles).requires_grad_(True)
    target = torch.Tensor(data.target)
    print("Shape of link_lengths:", link_lengths.shape)
    print("Shape of joint_angles:", joint_angles.shape)

    loss_function = mapLossFunction(data.lossFunction)
    optimizer = mapOptimizer(data.optimizer)([joint_angles], lr = data.learningRate)
    joint_angles = joint_angles.unsqueeze(1)

    def streamGenerator():
        iteration = 0
        error = float('inf')
        try:
            while error > data.errorThreshold and iteration < data.maxIteration:
                optimizer.zero_grad()
                positions = forward_kinematics_2d(link_lengths, joint_angles)
                end_eff_pos = positions[-1]
                error = loss_function(end_eff_pos,target)
                error.backward()
                optimizer.step()
                iteration += 1
                dataToSend = {
                    'positions': positions.tolist(),
                    'angles': joint_angles.squeeze().tolist(),
                    'error': error.item()
                }
                time.sleep(0.05)
                yield "data:"+json.dumps(dataToSend) + "\n\n"
        except GeneratorExit:
            return

    return Response(stream_with_context(streamGenerator()), mimetype="text/event-stream")
    
def mapLossFunction(id):
    match id:
        case 0:
            return torch.nn.MSELoss()
        case 1:
            return torch.nn.L1Loss()
        case 2:
            return torch.nn.HuberLoss(delta=10.0)

def mapOptimizer(id):
    match id:
        case 0:
            return torch.optim.SGD
        case 1:
            return torch.optim.Adam
        case 2:
            return torch.optim.Adagrad
        case 3:
            return torch.optim.RMSprop
    

def forward_kinematics_2d(link_lengths, joint_angles):
    cos_cumsum = torch.cos(torch.cumsum(joint_angles, 0))
    sin_cumsum = torch.sin(torch.cumsum(joint_angles, 0))
    link_lengths_repeated = link_lengths.repeat(1,2)
    cos_sin_cumsum = torch.cat([cos_cumsum, sin_cumsum], 1)
    temp = link_lengths_repeated * cos_sin_cumsum
    pos = torch.cumsum(temp, 0)
    return pos
    