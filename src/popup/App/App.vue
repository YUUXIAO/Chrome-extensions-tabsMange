<template>
  <div class="popup-wrapper">
    <!-- 搜索部分 -->
    <div class="search-wrapper flex-x-start flex-y-center">
      <Input search enter-button="搜索" v-model="searchVal" size="large" placeholder="可搜索域名或tab名称" @on-search="handleSearch"/>
    </div>
    <!-- tabs列表 -->
    <Collapse>
      <Panel v-for="(item, index) in tabTypes" :key="index" class="oneTabs">
        <i class="status" v-show="isCurrentWindow(item.windowId)"></i>
        {{isCurrentWindow(item.windowId)?'当前窗口':`其它窗口${index}`}}
        <div slot="content" class="menulist">
          <Collapse simple>
          <template v-for="(tab, tabIndex) in item.domains" >
            <Panel  v-if="tab.tabs.length" :key="tabIndex">
              <div class="head flex-x-between">
                <div class="domain flex">{{ tab.domain }}</div>
                <div class="delete flex-center">
                  <Icon
                    type="md-close"
                    color="#fff"
                    size="30px"
                    @click="closeAll($event, tab)"
                  />
                </div>
              </div>
              <div slot="content">
                <div
                  v-for="(tab1, tabIndex1) in tab.tabs"
                  :key="tabIndex1"
                  class="item flex-x-between"
                  @click="toggleTab(tab1)"
                >
                  <div class="title flex flex-x-start flex-y-center">
                    <img :src="tab1.favIconUrl" class="icon" />
                    <p class="flex pointer">{{ tab1.title }}</p>
                  </div>
                  <div class="delete flex-center">
                    <Icon
                      type="md-close"
                      color="#fff"
                      size="30px"
                      @click="closeOne($event, tab1)"
                    />
                  </div>
                </div>
              </div>
            </Panel>
            </template>
          </Collapse>
        </div>
      </Panel>
    </Collapse>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      searchVal:'迭代', // 搜索值
      tabTypes: {
        domains:[]
      },
      curWindowId: null, // 当前窗口ID
    };
  },
  mounted() {
    this.initTabs();
  },
  computed: {
    // 是否为当前窗口
    isCurrentWindow() {
      return function(id) {
        return id === this.curWindowId;
      };
    },
  },
  methods: {
    // 搜索关键词
    handleSearch(){
      console.log('搜索关键词')
      console.log(this.tabTypes)
      const _this = this

      // 判断域名相同
      const result = this.tabTypes.map((window)=>{
       const domains =  window.domains.filter((item)=>{
          return item.domain.includes(_this.searchVal)
        })
       return window.domains = domains
      })
      console.log(result)
      // 判断tab名称相同


    },



    async initTabs() {
      const ajaxArray = [this.getCurrentTab(), this.getTabLists()];
      const [currentTab, AllTabs] = await Promise.all(ajaxArray);
      const data = this.convertTabsData(AllTabs, currentTab);
      console.log('初始化列表数据')
      console.log(data);
      // 获取当前窗口 Id
      chrome.windows.getCurrent(({ id }) => {
        console.log("获取当前窗口信息");
        console.log(id);
        if (!id) return;
        this.curWindowId = id;
      });
      this.tabTypes = data;
    },
    getTabLists() {
      return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => resolve(tabs));
      });
    },
    getCurrentTab() {
      return new Promise((resolve) => {
        chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          (tabs) => resolve(tabs[0])
        );
      });
    },
    toggleTab(data) {
      chrome.windows.update(data.windowId, { focused: true });
      chrome.tabs.highlight({ tabs: data.index, windowId: data.windowId });
    },
    // 删除tab-全部
    closeAll(e, data) {
      e.stopPropagation();
      console.log(data);
      const ids = data.tabs.map((i) => i.id);
      chrome.tabs.remove(ids);
      this.initTabsList();
    },
    // 删除tab-单个
    closeOne(e,data){
        e.stopPropagation();
        console.log(data)
         chrome.tabs.remove(data.id);
         this.initTabsList(data.id);
    },
    // 刷新窗口列表数据
initTabsList(id){
  const _this = this
  if(typeof id === 'object'){
    // 批量删除
  }else{
    // 单个删除
    
    // 1. 找出当前窗口tabs列表
    const currentWindow = _this.tabTypes.find(i=> i.isCurWindow)
    if(currentWindow){
      // 2. 根据id判断排除已删除的tab
      const currentDomains = currentWindow.domains
      currentDomains.forEach(element => {
         element.tabs = element.tabs.filter(i=>{
          return i.id !== id
        })
      });
   
      // 3. 替换原来的tabs列表
      const result = _this.tabTypes.map(t=>{
        if(t.isCurWindow) t = currentWindow
        return t
      })
      _this.tabTypes = result
    }
  }
},

// 判断关闭页面是否包含当前页面

    extractDomain(url) {
      if (typeof url !== "string") {
        return "Others";
      }
      const ret = url.match(/(https?:\/\/[^/]+)/);
      return ret ? ret[1] : "Others";
    },
    convertTabsData(allTabs = [], currentTab = {}) {
      // 过滤非法数据
      if (!(allTabs.length > 0 && currentTab.windowId !== undefined)) {
        return [];
      }
      // 分组归类
      const hash = Object.create(null);
      for (const tab of allTabs) {
        // 按windowId第一层分组
        if (!hash[tab.windowId]) hash[tab.windowId] = {};

        // 按域名第二层分组
        const domain = this.extractDomain(tab.url);
        if (!hash[tab.windowId][domain]) hash[tab.windowId][domain] = [];
        hash[tab.windowId][domain].push(tab);
      }
      // 将hash从对象转成数组,判断当前创窗口
      const data = [];
      const curDomain = this.extractDomain(currentTab.url);
      Object.keys(hash).forEach((windowId) => {
        const domains = [];
        Object.keys(hash[windowId]).forEach((domain) => {
          domains.push({
            domain,
            tabs: hash[windowId][domain],
            isCurDomain: domain === curDomain,
          });
        });
        data.push({
          domains,
          windowId: Number(windowId),
          isCurWindow: Number(windowId) === currentTab.windowId,
          tabsCount: domains.reduce((acc, cur) => acc + cur.tabs.length, 0),
        });
      });

// 排序，将当前窗口排到最顶
  data.sort((winA, winB) => {
        if (winA.isCurWindow) {
          return -1;
        } else if (winB.isCurWindow) {
          return 1;
        } else {
          return 0;
        }
      });


      // 将域名合并的tabs 顺序往上提
      data.forEach((window) => {
        window.domains.sort((domainA, domainB) => {
          if (domainA.tabs.length > 1 && domainB.tabs.length === 1) {
            return -1;
          } else if (domainB.tabs.length > 1 && domainA.tabs.length === 1) {
            return 1;
          } else {
            return 0;
          }
        });
      });


      return data;

    },
  },
};
</script>

<style>
/* 搜索部分 */
.search-wrapper{
  padding: 12px;
  border: 1px solid red;
}



.status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
  background: greenyellow;
}

.popup-wrapper {
  width: 300px;
  height: 550px;
  background-color: #fff;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
  background-color: #f5f5f5;
}
/*定义滚动条轨道
 内阴影+圆角*/
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0px rgba(0, 0, 0, 0.3);
  border-radius: 0;
  background-color: #f5f5f5;
}
/*定义滑块
 内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border-radius: 0;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #555;
}

.ivu-collapse-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
}

.ivu-icon-ios-arrow-forward {
  margin-right: 20px;
}

.item {
  height: 35px;
  padding: 3px 0 3px 12px;
  background: #f3f3f5;
  border-bottom: 1px solid #eee;
}

.menulist .ivu-icon-ios-arrow-forward{
  display: none;
}

.domain {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;word-break:break-all;
  width: 100%;
  color: #2b85e4;
}

.head {
  width: 100%;
  height: 100%;
}

.head:hover > .delete {
  height: 100%;
  opacity: 1;
  transition: 1s all;
}

.item {
  height: 45px;
}

.item p {
  display: flex;
  color: #555;
  width: 100%;
  font-size: 12px;
  line-height: 25px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  cursor: pointer;
}

.item .icon {
  width: 20px;
  margin-right: 6px;
  border-radius: 50%;
  border: 1px solid #dcdee2;
}

.delete {
  background: #ed4014;
  width: 40px;
  height: 100%;
  opacity: 0;
}

.item:hover > .delete {
  opacity: 1;
  transition: 1s all;
}

.ivu-collapse-content,
.ivu-collapse-content,
.ivu-collapse-content-box {
  padding: 0 !important;
}

.dis-flex {
  display: flex;
}
.flex-x-start {
  display: flex;
  justify-content: flex-start;
}
.flex-x-center {
  display: flex;
  justify-content: center;
}
.flex-x-between {
  display: flex;
  justify-content: space-between;
}
.flex-x-around {
  display: flex;
  justify-content: space-around;
}
.flex-x-end {
  display: flex;
  justify-content: flex-end;
}
.flex-y-center {
  display: flex;
  align-items: center;
}
.flex-dir-column {
  flex-direction: column;
}
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}
.flex-y-end {
  display: flex;
  align-items: flex-end;
}
.flex {
  flex: 1;
}

.border-box {
  box-sizing: border-box;
}
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-mcenter {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.trans-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
