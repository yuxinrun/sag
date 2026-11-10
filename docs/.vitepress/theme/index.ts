import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import HeroDiagram from './components/HeroDiagram.vue'
import EventEntityDiagram from './components/EventEntityDiagram.vue'
import SagPipeline from './components/SagPipeline.vue'
import AssemblyGraph from './components/AssemblyGraph.vue'
import BenchmarkBars from './components/BenchmarkBars.vue'
import QueryTrace from './components/QueryTrace.vue'
import BrandMark from './components/BrandMark.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroDiagram),
      'home-hero-info-before': () => h(BrandMark, { variant: 'pill' })
    })
  },
  enhanceApp({ app }) {
    app.component('BrandMark', BrandMark)
    app.component('EventEntityDiagram', EventEntityDiagram)
    app.component('SagPipeline', SagPipeline)
    app.component('AssemblyGraph', AssemblyGraph)
    app.component('BenchmarkBars', BenchmarkBars)
    app.component('QueryTrace', QueryTrace)
  }
}
