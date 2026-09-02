import './model/catalog';
import './styles/scout-tokens.generated.css';
import './styles/scout-render.css';
import './styles/app.css';
import {App} from './editor/app';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
const app = new App(root);

declare global {
  interface Window {
    esMockup?: App;
  }
}
window.esMockup = app;
