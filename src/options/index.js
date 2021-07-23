import Vue from 'vue';
import '../assets/common.css';
import 'view-design/dist/styles/iview.css';

import {
  Collapse,
  Panel,
  Menu,
  Icon,
  Input,
  Button,
  Col,
  Submenu,
  MenuItem,
  Divider,
  FormItem,
  Form,
  Modal,
  Table,
} from 'iview';
import AppComponent from './App/App.vue';

Vue.component('Collapse', Collapse);
Vue.component('Panel', Panel);
Vue.component('Menu', Menu);
Vue.component('Icon', Icon);
Vue.component('Input', Input);
Vue.component('Button', Button);
Vue.component('Col', Col);
Vue.component('Submenu', Submenu);
Vue.component('MenuItem', MenuItem);
Vue.component('Divider', Divider);
Vue.component('FormItem', FormItem);
Vue.component('Form', Form);
Vue.component('Table', Table);
Vue.component('Modal', Modal);
Vue.component('app-component', AppComponent);

new Vue({
  el: '#app',
  render: (createElement) => {
    return createElement(AppComponent);
  },
});
