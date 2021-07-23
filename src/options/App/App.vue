<template>
  <div class="option-warpper flex-x-start ">
    <div class="menulist">
      <Menu :active-name="activeName" @on-select="updateActiveName">
        <MenuItem
          :name="menu.key"
          v-for="(menu, index) in menuList"
          :key="index"
        >
          <Icon type="ios-paper" />{{ menu.title }}</MenuItem
        >
      </Menu>
    </div>
    <div class="content flex">
      <oneTabGroup v-if="activeName === '1-2'" />
    </div>
  </div>
</template>

<script>
import oneTabGroup from './components/oneTabGroup.vue';

export default {
  name: 'tabGroup',
  components: { oneTabGroup },
  data() {
    return {
      activeName: '1-1',
      activeTab: 'tabList',
      menuList: [
        {
          key: '1-1',
          title: '标签组列表',
          tabName: 'tabList',
        },
        {
          key: '1-2',
          title: '新增标签组',
          tabName: 'tabGroupEdit',
        },
      ],
    };
  },
  mounted() {
    // 往存储中写入数据
    chrome.storage.set({ tabsGroups: [] }, function() {
      console.log('保存成功');
    });
  },
  methods: {
    // 切换菜单
    updateActiveName(name) {
      this.activeName = name;
    },
  },
};
</script>

<style>
html,
body {
  height: 100%;
}
.option-warpper {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 30px;
}
/* 左侧菜单栏 */
.menulist {
  width: 240px;
  height: 300px;
  border-right: 1px solid #ccc;
}

/* 内容区域 */
.content {
  padding-left: 30px;
}
</style>
