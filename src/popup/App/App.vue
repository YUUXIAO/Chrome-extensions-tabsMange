<template>
  <div class="popup-wrapper">
    <Collapse>
      <Panel v-for="(item, index) in tabTypes" :key="index" class="oneTabs">
        窗口{{ item.windowId }}-{{ item.tabsCount }}
        <div slot="content">
          <Collapse simple>
            <Panel v-for="(tab, tabIndex) in item.domains" :key="tabIndex">
              <template class="title">
                <span>{{ tab.domain }}</span>
                <span class="delete" @click="closeAll($event, tab)">del</span>
              </template>
              <div slot="content">
                <div
                  v-for="(tab1, tabIndex1) in tab.tabs"
                  :key="tabIndex1"
                  class="item"
                  @click="toggleTab(tab1)"
                >
                  <p>{{ tab1.title }}</p>
                  <span class="delete" @click="closeAll($event, tab)">del</span>
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

.delete {
  margin-left: 10px;
  border: 1px solid red;
}
.title {
  border: 1px solid green;
}
.title:hover .delete {
  display: block;
}

.item {
  display: flex;
  align-content: center;
  justify-content: space-between;
  border: 1px solid red;
  border-bottom: 1px solid #efefef;
}
.item p {
  display: flex;
  width: 100%;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}
.item .delete {
  width: 100px;
}
</style>
