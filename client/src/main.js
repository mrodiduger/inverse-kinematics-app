import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.css'

const app = createApp(App)


app.use(router)

// Global error handler
/*
app.config.errorHandler = (err, instance, info) => {

    // Handle the error globally
    console.err("Global error:", err);
    console.log("Vue instance:", instance);
    console.log("Error info:", info);
  
    // Add code for UI notifications, reporting or other error handling logic
};
*/

app.mount('#app')
