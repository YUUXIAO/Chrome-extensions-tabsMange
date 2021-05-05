import Vue from "vue";
import AppComponent from "./App/App.vue";
import 'view-design/dist/styles/iview.css';
import {
    Collapse,
    Panel,
    Cell
} from 'iview';

Vue.component('Collapse', Collapse);
Vue.component('Panel', Panel);
Vue.component('Cell', Cell);
Vue.component("app-component", AppComponent);


new Vue({
    el: "#app",
    render: createElement => {
        return createElement(AppComponent);
    }
});