<template>
  <Layout :user="user">
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>系统看板</h1>
        <el-button @click="resetLayout" size="small">重置布局</el-button>
      </div>
      
      <draggable 
        v-model="dashboardItems" 
        item-key="id"
        animation="200"
        class="dashboard-grid"
        :disabled="false"
        ghost-class="ghost"
        chosen-class="chosen"
      >
        <template #item="{ element }">
          <div class="dashboard-item" :class="element.size || 'full'">
            <el-card class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <h2>{{ element.title }}</h2>
                  <el-button 
                    @click="removeItem(element.id)" 
                    type="danger" 
                    size="small" 
                    circle 
                    icon="Delete"
                  />
                </div>
              </template>
              
              <div class="card-content">
                <!-- 欢迎卡片 -->
                <div v-if="element.type === 'welcome'" class="welcome-content">
                  <h3>欢迎, {{ user.username }}!</h3>
                  <p>您已成功登录AI检漏管理系统</p>
                  
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
                </div>
                
                <!-- 上传趋势图表 -->
                <div v-else-if="element.type === 'upload-trend'" class="chart-container" v-loading="chartLoading">
                  <v-chart class="chart" :option="chartOption" autoresize />
                </div>
                
                <!-- 风险统计图表 -->
                <div v-else-if="element.type === 'risk-stats'" class="chart-container" v-loading="riskChartLoading">
                  <v-chart class="chart" :option="riskChartOption" autoresize />
                </div>
                
                <!-- 最近文件卡片 -->
                <div v-else-if="element.type === 'recent-files'" class="recent-files">
                  <el-table :data="recentFiles" style="width: 100%" max-height="300">
                    <el-table-column prop="filename" label="文件名" />
                    <el-table-column prop="risk_level" label="风险等级">
                      <template #default="scope">
                        <el-tag :type="getRiskLevelTagType(scope.row.risk_level)">
                          {{ scope.row.risk_level || '未检测' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="upload_time" label="上传时间" />
                  </el-table>
                </div>
                
                <!-- 用户统计卡片 -->
                <div v-else-if="element.type === 'user-stats'" class="user-stats">
                  <div class="stats-info">
                    <div class="stats-item">
                      <div class="stats-value">{{ stats.users }}</div>
                      <div class="stats-label">总用户数</div>
                    </div>
                    <div class="stats-item">
                      <div class="stats-value">{{ stats.audioFiles }}</div>
                      <div class="stats-label">总文件数</div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </template>
      </draggable>
      
      <!-- 添加卡片按钮 -->
      <div class="add-card-section">
        <el-dropdown @command="addCard">
          <el-button type="primary">
            添加卡片 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="upload-trend">上传趋势图表</el-dropdown-item>
              <el-dropdown-item command="risk-stats">风险统计图表</el-dropdown-item>
              <el-dropdown-item command="recent-files">最近文件</el-dropdown-item>
              <el-dropdown-item command="user-stats">用户统计</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { Document, User, Delete, ArrowDown } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { apiClient } from '../config/api'
import draggable from 'vuedraggable'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
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
    Delete,
    ArrowDown,
    VChart,
    draggable
  },
  data() {
    return {
      user: {},
      stats: {
        audioFiles: 0,
        users: 1
      },
      recentFiles: [],
      chartLoading: false,
      riskChartLoading: false,
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
      },
      riskChartOption: {
        title: {
          text: '文件风险情况统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            type: 'pie',
            radius: '50%',
            data: [],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      },
      dashboardItems: [
        {
          id: 'welcome',
          title: '系统概览',
          type: 'welcome',
          size: 'full'
        },
        {
          id: 'upload-trend',
          title: '音频上传趋势',
          type: 'upload-trend',
          size: 'half'
        },
        {
          id: 'risk-stats',
          title: '文件风险情况统计',
          type: 'risk-stats',
          size: 'half'
        }
      ]
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
    
    // 获取风险统计图表数据
    await this.fetchRiskChartData()
    
    // 加载保存的布局
    this.loadLayout()
  },
  
  methods: {
    async fetchStats() {
      try {
        // 获取音频文件统计
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          this.stats.audioFiles = response.data.data.length
          this.recentFiles = response.data.data.slice(0, 5) // 获取最近5个文件
        }
        
        // 获取用户统计
        const userResponse = await apiClient.get('/users')
        if (userResponse.data.success) {
          this.stats.users = userResponse.data.total
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
    
    async fetchRiskChartData() {
      this.riskChartLoading = true
      try {
        // 获取所有音频文件数据
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          // 处理数据，按风险等级统计
          const riskData = this.processRiskData(response.data.data)
          
          // 更新图表数据
          this.riskChartOption.series[0].data = riskData
        }
      } catch (error) {
        console.error('获取风险统计图表数据失败:', error)
        this.$message.error('获取风险统计图表数据失败')
      } finally {
        this.riskChartLoading = false
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
    },
    
    processRiskData(audioFiles) {
      // 创建一个映射来存储不同风险等级的数量
      const riskMap = new Map([
        ['高风险', 0],
        ['中风险', 0],
        ['低风险', 0],
        ['未检测', 0]
      ])
      
      // 统计各个风险等级的数量
      audioFiles.forEach(file => {
        const riskLevel = file.risk_level || '未检测'
        if (riskMap.has(riskLevel)) {
          riskMap.set(riskLevel, riskMap.get(riskLevel) + 1)
        } else {
          riskMap.set(riskLevel, 1)
        }
      })
      
      // 转换为饼图所需的数据格式
      const riskData = []
      for (const [level, count] of riskMap.entries()) {
        if (count > 0) {
          riskData.push({
            value: count,
            name: level
          })
        }
      }
      
      return riskData
    },
    
    getRiskLevelTagType(riskLevel) {
      const typeMap = {
        '高风险': 'danger',
        '中风险': 'warning',
        '低风险': 'success',
        '未检测': 'info'
      }
      return typeMap[riskLevel] || 'info'
    },
    
    addCard(type) {
      const cards = {
        'upload-trend': {
          id: 'upload-trend-' + Date.now(),
          title: '音频上传趋势',
          type: 'upload-trend',
          size: 'half'
        },
        'risk-stats': {
          id: 'risk-stats-' + Date.now(),
          title: '文件风险情况统计',
          type: 'risk-stats',
          size: 'half'
        },
        'recent-files': {
          id: 'recent-files-' + Date.now(),
          title: '最近文件',
          type: 'recent-files',
          size: 'half'
        },
        'user-stats': {
          id: 'user-stats-' + Date.now(),
          title: '用户统计',
          type: 'user-stats',
          size: 'half'
        }
      }
      
      this.dashboardItems.push(cards[type])
      this.saveLayout()
    },
    
    removeItem(id) {
      this.dashboardItems = this.dashboardItems.filter(item => item.id !== id)
      this.saveLayout()
    },
    
    resetLayout() {
      this.dashboardItems = [
        {
          id: 'welcome',
          title: '系统概览',
          type: 'welcome',
          size: 'full'
        },
        {
          id: 'upload-trend',
          title: '音频上传趋势',
          type: 'upload-trend',
          size: 'half'
        },
        {
          id: 'risk-stats',
          title: '文件风险情况统计',
          type: 'risk-stats',
          size: 'half'
        }
      ]
      this.saveLayout()
    },
    
    saveLayout() {
      localStorage.setItem('dashboardLayout', JSON.stringify(this.dashboardItems))
    },
    
    loadLayout() {
      const savedLayout = localStorage.getItem('dashboardLayout')
      if (savedLayout) {
        try {
          const items = JSON.parse(savedLayout)
          // 确保每个项目都有size属性
          this.dashboardItems = items.map(item => ({
            ...item,
            size: item.size || 'full'
          }))
        } catch (e) {
          console.error('加载布局失败:', e)
          // 如果解析失败，使用默认布局
          this.resetLayout()
        }
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-item {
  transition: transform 0.2s ease;
}

.dashboard-item.full {
  grid-column: span 2;
}

.dashboard-item.half {
  grid-column: span 1;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-item.full,
  .dashboard-item.half {
    grid-column: span 1;
  }
}

.dashboard-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  min-height: 200px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px;
}

.stat-icon {
  font-size: 30px;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chart-container {
  height: 300px;
  padding: 10px 0;
}

.chart {
  height: 100%;
  width: 100%;
}

.recent-files {
  padding: 10px;
}

.user-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.stats-info {
  display: flex;
  gap: 40px;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stats-label {
  font-size: 16px;
  color: #666;
  margin-top: 5px;
}

.add-card-section {
  text-align: center;
  padding: 20px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  border: 2px solid #409eff;
  transform: scale(0.98);
}
</style>