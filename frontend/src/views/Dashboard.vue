<template>
  <Layout :user="user">
    <div class="dashboard-container">
      <el-card class="welcome-card">
        <template #header>
          <div class="card-header">
            <h2>系统概览</h2>
          </div>
        </template>
        
        <div class="welcome-content">
          <h3>欢迎, {{ user.username }}!</h3>
          <p>您已成功登录AI检漏管理系统</p>
        </div>
        
        <div class="stats-grid">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon" color="#409eff"><Document /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ stats.audioFiles }}</div>
                <div class="stat-label">音频文件</div>
              </div>
            </div>
          </el-card>
          
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon" color="#67c23a"><User /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ stats.users }}</div>
                <div class="stat-label">用户数</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
      
      <!-- 音频上传趋势图表 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <h2>音频上传趋势</h2>
          </div>
        </template>
        
        <div class="chart-container" v-loading="chartLoading">
          <v-chart class="chart" :option="chartOption" autoresize />
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { Document, User } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { apiClient } from '../config/api'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

export default {
  name: 'Dashboard',
  components: {
    Layout,
    Document,
    User,
    VChart
  },
  data() {
    return {
      user: {},
      stats: {
        audioFiles: 0,
        users: 1
      },
      chartLoading: false,
      chartOption: {
        title: {
          text: '最近7天音频上传数量',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [],
            type: 'line',
            smooth: true,
            areaStyle: {
              color: '#409eff'
            },
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      }
    }
  },
  
  async mounted() {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    
    // 获取统计信息
    await this.fetchStats()
    
    // 获取图表数据
    await this.fetchChartData()
  },
  
  methods: {
    async fetchStats() {
      try {
        // 获取音频文件统计
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          this.stats.audioFiles = response.data.data.length
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
      }
    },
    
    async fetchChartData() {
      this.chartLoading = true
      try {
        // 获取所有音频文件数据
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          // 处理数据，按日期统计
          const dailyData = this.processDailyData(response.data.data)
          
          // 更新图表数据
          this.chartOption.xAxis.data = dailyData.dates
          this.chartOption.series[0].data = dailyData.counts
        }
      } catch (error) {
        console.error('获取图表数据失败:', error)
        this.$message.error('获取图表数据失败')
      } finally {
        this.chartLoading = false
      }
    },
    
    processDailyData(audioFiles) {
      // 创建一个映射来存储每天的文件数量
      const dateMap = new Map()
      
      // 获取最近7天的日期
      const dates = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const dateStr = `${month}-${day}`
        dates.push(dateStr)
        dateMap.set(dateStr, 0)
      }
      
      // 统计每天的文件数量
      audioFiles.forEach(file => {
        // 从 upload_time 提取日期部分
        const uploadDate = file.upload_time.split(' ')[0]
        const [year, month, day] = uploadDate.split('-')
        const dateStr = `${month}-${day}`
        
        if (dateMap.has(dateStr)) {
          dateMap.set(dateStr, dateMap.get(dateStr) + 1)
        }
      })
      
      // 转换为数组
      const counts = dates.map(date => dateMap.get(date))
      
      return {
        dates,
        counts
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  text-align: center;
}

.welcome-content {
  text-align: center;
  margin-bottom: 30px;
}

.welcome-content h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.welcome-content p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  font-size: 40px;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.chart-card {
  margin-top: 20px;
}

.chart-container {
  height: 400px;
  padding: 20px 0;
}

.chart {
  height: 100%;
  width: 100%;
}
</style>