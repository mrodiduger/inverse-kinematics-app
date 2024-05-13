<template>
    <div id="sidebar">
        <Config 
            v-model:learningRate.number="learningRate"
            v-model:numLinks.number="numLinks"
            v-model:maxIteration.number="maxIteration"
            v-model:errorThreshold.number="errorThreshold"
            v-model:lossFunction="lossFunction"
            v-model:optimizer="optimizer"
        />
        <h2>Iteration Count: {{ iterationCount }}</h2>
        <h2>Error: {{error}}</h2>
        <button id="simulateButton" @click="simulate" type="button" :disabled="isInSimulation" class="btn btn-primary">Simulate</button>
        <button id="simulateButton" @click="stop" type="button" :disabled="!isInSimulation" class="btn btn-primary">Stop</button>
    </div>
    <div id="canvas">
        <canvas id="canvasElement" ref="canvasElement" width="1920" height="1080"></canvas>
    </div>
</template>
  
<script setup>

    import { ref, onMounted, watch, computed, reactive } from 'vue';
    import Config from '../components/Config.vue';

    
    //configuration parameters
    const learningRate = ref(1e-5);
    const numLinks = ref(2);
    const maxIteration = ref(500);
    const errorThreshold = ref(2.0);
    const lossFunction = ref(0);
    const optimizer = ref(0);

    //latent parameters, link lengths might be made configurable in the future
    const linkLengths = ref(new Array(numLinks.value).fill(150));
    const initialAngles = ref(new Array(numLinks.value).fill(3*Math.PI/2));
    const target = ref(null);

    const iterationCount = ref(0);
    const error = ref(0);

    const canvasElement = ref();
    const canvasContext = ref(null);

    const positionsBuffer = ref([]);

    watch(numLinks, (newNumLinks) => {
        linkLengths.value = new Array(newNumLinks).fill(150);
        initialAngles.value = new Array(newNumLinks).fill(3*Math.PI/2);
    });

    const simulatePath = '/api/simulate';
    const url = ref(new URL(window.location.origin + simulatePath));
    let isInSimulation = ref(false)
    const activeEventSource = ref(null);
    const readyState = ref(EventSource.CLOSED);
    
    watch(readyState, (newStatus) => {
        switch(newStatus) {
            case EventSource.CONNECTING:
            case EventSource.OPEN:
                isInSimulation.value = true;
                break;
            case EventSource.CLOSED:
                isInSimulation.value = false;
                break;
        }
    });
    
    

    function simulate() {
        if (target.value == null) {
            throw new Error("No target is set, please set a target by clicking somewhere on the canvas!");
        }
        console.log("clicked simulate...");
        const data = {
            learningRate: learningRate.value,
            numLinks: numLinks.value,
            maxIteration: maxIteration.value,
            errorThreshold: errorThreshold.value,
            lossFunction: lossFunction.value,
            optimizer: optimizer.value,
            linkLengths: linkLengths.value,
            initialAngles: initialAngles.value,
            target: target.value
        }
        
        
        url.value.search = new URLSearchParams({config: JSON.stringify(data)});

        iterationCount.value = 0;

        // Setup EventSource
        const eventSource = new EventSource(url.value);
        activeEventSource.value = eventSource;
        eventSource.onopen = () => {
            readyState.value = EventSource.OPEN;
        };
        eventSource.onmessage = function(event) {
            console.log('Received data:', event.data);
            const data = JSON.parse(event.data);
            iterationCount.value += 1;
            error.value = data["error"].toFixed(4);
            initialAngles.value = data["angles"];
            positionsBuffer.value = data["positions"];
        };

        eventSource.onerror = function(error) {
            if (error.eventPhase == EventSource.CLOSED) {
                // Connection was closed.
                eventSource.close();
            } else {
                console.error('EventSource failed:', error);
                eventSource.close();
            }
            readyState.value = activeEventSource.value.readyState;
        };
    }

    function stop() {
        if (activeEventSource.value) {
            readyState.value = EventSource.CLOSED;
            activeEventSource.value.close();
        }
    }

    function drawArm(positions) {
        const ctx = canvasContext.value;
        ctx.clearRect(- canvasElement.value.width/2, - canvasElement.value.height/2, canvasElement.value.width, canvasElement.value.height); // Clear the canvas
        const circle = new Path2D();
        circle.arc(target.value[0], target.value[1], 10, 0, 2 * Math.PI);
        ctx.beginPath();
        ctx.moveTo(0,0);
        positionsBuffer.value.forEach(position => {
            ctx.lineTo(position[0], position[1]);
        });
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.fill(circle);
    }

    watch(positionsBuffer, () => {
        requestAnimationFrame(drawArm);
    }, { deep: true });



    onMounted(() => {
        canvasContext.value = canvasElement.value.getContext('2d');
        canvasContext.value.translate(canvasElement.value.width/2,canvasElement.value.height/2);

        canvasElement.value.addEventListener( 'click', event => {
            
            if(target.value != null) {
                canvasContext.value.clearRect(target.value[0] - 10, target.value[1] - 10,20,20)
            }
    
            const bb = canvasElement.value.getBoundingClientRect();
            const x = Math.floor( (event.clientX - bb.left) / bb.width * canvasElement.value.width ) - canvasElement.value.width/2;
            const y = Math.floor( (event.clientY - bb.top) / bb.height * canvasElement.value.height )- canvasElement.value.height/2;

            target.value = [x,y]
            const circle = new Path2D();
            circle.arc(x, y, 10, 0, 2 * Math.PI);
            canvasContext.value.fill(circle);
            
            console.log({ x, y });

        });
    });
</script>
  
<style scoped>
  #sidebar {
    float: left;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 0px;
    width: 100%;
    height: auto;
    gap: 10px;
  }

  #canvasElement {
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    margin: 10px;
    width: 100%;
    aspect-ratio: 1920/1080W;
  }

  #simulateButton {
    width: 100%;
  }
  #simulateButton:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }

  /* Styles for screens that are 600px or larger */
@media screen and (min-width: 800px) {
  #sidebar {
    width: 15vw; /* Sidebar width for larger screens */
    height: 95vh; /* Sidebar height for larger screens */
  }

  #canvasElement {
    width: 80vw; /* Canvas width for larger screens */
  }
}
</style>


  