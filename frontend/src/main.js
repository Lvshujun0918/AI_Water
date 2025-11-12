import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import * as echarts from 'echarts'

import API_CONFIG from './config/api'

// 配置 axios 基础 URL
axios.defaults.baseURL = API_CONFIG.getFullUrl('');

const app = createApp(App)

// 注册 Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 全局注册 ECharts 组件
app.component('ECharts', {
  props: ['options'],
  template: '<div ref="chart" style="width: 100%; height: 400px;"></div>',
  mounted() {
    this.renderChart();
  },
  watch: {
    options: {
      handler() {
        this.renderChart();
      },
      deep: true
    }
  },
  methods: {
    renderChart() {
      if (this.$refs.chart) {
        const chart = echarts.getInstanceByDom(this.$refs.chart) || echarts.init(this.$refs.chart);
        chart.setOption(this.options, true);
      }
    }
  },
  beforeUnmount() {
    if (this.$refs.chart) {
      const chart = echarts.getInstanceByDom(this.$refs.chart);
      if (chart) {
        chart.dispose();
      }
    }
  }
})

// 使用 ElementPlus
app.use(ElementPlus)

// 使用路由
app.use(router)

// 挂载应用
app.mount('#app')