<template>
  <div class="popup-wrapper">
    <Collapse>
      <Panel v-for="(item, index) in tabTypes" :key="index" class="oneTabs">
        窗口{{ item.windowId }}-{{ item.tabsCount }}
        <div slot="content">
          <Collapse simple>
            <Panel
              v-for="(tab, tabIndex) in item.domains"
              :key="tabIndex"
              class="title flex-x-between"
            >
              <!-- <template class="title flex-x-between"> -->
              <span>{{ tab.domain }}</span>
              <div class="delete flex-center">
                <Icon
                  type="md-close"
                  color="#fff"
                  size="30px"
                  @click="closeAll($event, tab)"
                />
              </div>
              <!-- </template> -->
              <div slot="content">
                <div
                  v-for="(tab1, tabIndex1) in tab.tabs"
                  :key="tabIndex1"
                  class="item flex-x-between"
                  @click="toggleTab(tab1)"
                >
                  <div class="title">
                    <img :src="tab1.favIconUrl" class="icon" />
                    <p>{{ tab1.title }}</p>
                  </div>
                  <div class="delete flex-center">
                    <Icon
                      type="md-close"
                      color="#fff"
                      size="30px"
                      @click="closeAll($event, tab1)"
                    />
                  </div>
                </div>
              </div>
            </Panel>
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
      tabTypes: {},
      currentTab: {},
    };
  },
  mounted() {
    this.initTabs();
  },
  methods: {
    async initTabs() {
      const ajaxArray = [this.getCurrentTab(), this.getTabLists()];
      const [currentTab, AllTabs] = await Promise.all(ajaxArray);
      const data = this.convertTabsData(AllTabs, currentTab);
      console.log(data);
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
    // 删除tab
    closeAll(e, data) {
      e.stopPropagation();
      console.log(data);
      const ids = data.tabs.map((i) => i.id);
      chrome.tabs.remove(ids);
      this.initTabs();
    },
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
      console.log(hash);

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
      return data;

      // 进行排序，将域名合并的tabs和当前窗口的顺序尽量往上提，保证更好的体验
      // data.forEach((window) => {
      //   window.domains.sort((domainA, domainB) => {
      //     if (domainA.tabs.length > 1 && domainB.tabs.length === 1) {
      //       return -1;
      //     } else if (domainB.tabs.length > 1 && domainA.tabs.length === 1) {
      //       return 1;
      //     } else {
      //       return 0;
      //     }
      //   });
      // });
      // data.sort((winA, winB) => {
      //   if (winA.isCurWindow) {
      //     return -1;
      //   } else if (winB.isCurWindow) {
      //     return 1;
      //   } else {
      //     return 0;
      //   }
      // });

      // return data;
    },
  },
};
</script>

<style>
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

.title {
  border: 1px solid green;
}

.item {
  height: 35px;
  padding: 3px 0 3px 12px;
  border: 1px solid red;
  background: #f3f3f5;
  border-bottom: 1px solid #eee;
}
.item .title {
  display: flex;
}
.item p {
  display: flex;
  color: #555;
  width: 100%;
  font-size: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.item .icon {
  width: 16px;
  margin-right: 6px;
}

.delete {
  background: #ed4014;
  width: 40px;
  height: 100%;
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
