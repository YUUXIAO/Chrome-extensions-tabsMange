<template>
  <div class="popup-wrapper">
    <!-- 搜索部分 -->
    <div class="search-wrapper flex-x-start flex-y-center">
      <Input
        search
        enter-button="搜索"
        v-model="searchVal"
        placeholder="可搜索域名或tab名称"
        @on-search="handleSearch"
      />
    </div>
    <Collapse accordion>
      <template v-for="(item, index) in tabTypes">
        <Panel :key="index" v-if="item.domains && item.domains.length">
          <i class="status" v-show="isCurrentWindow(item.windowId)"></i>
          {{ isCurrentWindow(item.windowId) ? `当前窗口` : `其它窗口` }}
          <div slot="content" class="menulist">
            <Collapse simple accordion>
              <template v-for="(tab, tabIndex) in item.domains">
                <Panel v-if="tab.tabs.length" :key="tabIndex">
                  <div class="head flex flex-x-between">
                    <div class="flex title flex-x-start flex-y-center">
                      <img
                        v-if="tab.domainIcon"
                        :src="tab.domainIcon"
                        class="icon"
                      />
                      <div class="domain flex">{{ tab.domain }}</div>
                    </div>
                    <div class="delete flex-center">
                      <Icon
                        type="md-close"
                        color="#fff"
                        size="30px"
                        @click.stop="closeAll(tab, item.windowId, tabIndex)"
                      />
                    </div>
                  </div>
                  <div slot="content">
                    <div
                      v-for="(tab1, tabIndex1) in tab.tabs"
                      :key="tabIndex1"
                      class="item flex-x-between"
                      @click="toggleTabs(tab1)"
                    >
                      <p class="title flex pointer">{{ tab1.title }}</p>
                      <div class="delete flex-center">
                        <Icon
                          type="md-close"
                          color="#fff"
                          size="30px"
                          @click.stop="closeOne(tab1, item.windowId)"
                        />
                      </div>
                    </div>
                  </div>
                </Panel>
              </template>
            </Collapse>
          </div>
        </Panel>
      </template>
    </Collapse>
  </div>
</template>

<script>
import {
  getTabLists,
  getCurrentTab,
  toggleTab,
  getCurrentWindowId,
  deleteTab,
} from '../../utils/utils';

export default {
  name: 'app',
  data() {
    return {
      searchVal: '', // 搜索值
      tabsData: {},
      tabTypes: {
        domains: [],
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
    handleSearch() {
      const _this = this;
      const tabTypes = JSON.parse(JSON.stringify(this.tabsData));
      if (!this.searchVal) {
        this.tabTypes = tabTypes;
        return;
      }
      tabTypes.map((window) => {
        const domains = window.domains.filter((item) => {
          if (item.domain.includes(_this.searchVal)) return item; // 域名匹配
          // 标签匹配
          const hasSameTbas = item.tabs.filter((tab) => {
            return tab.title.includes(_this.searchVal);
          });
          if (hasSameTbas.length) {
            item.tabs = hasSameTbas;
            return item;
          }
        });
        return (window.domains = domains);
      });
      this.tabTypes = tabTypes;
    },

    // 初始化数据
    async initTabs() {
      const ajaxArray = [getCurrentTab(), getTabLists(), getCurrentWindowId()];
      const [currentTab, AllTabs, curWindowId] = await Promise.all(ajaxArray);
      const data = this.convertTabsData(AllTabs, currentTab);
      console.log('初始化列表数据====>');
      console.log(data);
      this.curWindowId = curWindowId; // 当前窗口ID
      this.tabsData = this.tabTypes = data;
    },
    // 切换标签
    toggleTabs(data) {
      toggleTab(data);
    },
    // 删除tab-全部
    closeAll(data, windowId, tabIndex) {
      const ids = data.tabs.map((i) => i.id);
      deleteTab(ids).then(() => {
        this.initTabsList(ids, windowId, tabIndex);
      });
    },
    // 删除tab-单个
    closeOne({ id }, windowId) {
      deleteTab(id).then(() => {
        this.initTabsList(id, windowId);
      });
    },
    // 刷新窗口列表数据
    initTabsList(id, windowId, tabIndex) {
      const _this = this;
      const currentWindow = _this.tabTypes.find((i) => i.windowId === windowId); // 删除tab的窗口tabs列表
      // 判断是批量删除还是单个删除
      if (Array.isArray(id)) {
        const domains = currentWindow.domains.filter((i, index) => {
          return index !== tabIndex;
        });
        currentWindow.domains = domains;
      } else {
        if (currentWindow) {
          // 根据id判断排除已删除的tab
          const currentDomains = currentWindow.domains;
          currentDomains.forEach((element) => {
            element.tabs = element.tabs.filter((i) => {
              return i.id !== id;
            });
          });
        }
      }
    },
    // 域名校验，判断有无域名tab
    extractDomain(url) {
      if (typeof url !== 'string') {
        return 'Others';
      }
      const ret = url.match(/(https?:\/\/[^/]+)/);
      return ret ? ret[1] : 'Others';
    },
    convertTabsData(allTabs = [], currentTab = {}) {
      if (!(allTabs.length > 0 && currentTab.windowId !== undefined)) return [];
      // 分组归类
      const tabsObj = Object.create(null);
      for (const tab of allTabs) {
        const domain = this.extractDomain(tab.url);
        if (!tabsObj[tab.windowId]) tabsObj[tab.windowId] = {}; // 按windowId第一层分组
        if (!tabsObj[tab.windowId][domain]) tabsObj[tab.windowId][domain] = []; // 按域名第二层分组
        tabsObj[tab.windowId][domain].push(tab);
      }
      // 将hash从对象转成数组,判断当前窗口
      const result = [];
      const curDomain = this.extractDomain(currentTab.url);
      Object.keys(tabsObj).forEach((windowId) => {
        const domains = [];
        Object.keys(tabsObj[windowId]).forEach((domain, index) => {
          domains.push({
            domain,
            domainIcon: tabsObj[windowId][domain][0].favIconUrl || '',
            tabs: tabsObj[windowId][domain],
            sort: index,
            isCurDomain: domain === curDomain,
          });
        });
        result.push({
          domains,
          windowId: Number(windowId),
          isCurWindow: Number(windowId) === currentTab.windowId,
          tabsCount: domains.reduce((acc, cur) => acc + cur.tabs.length, 0),
        });
      });

      // 排序，将当前窗口排到最顶
      result.sort((winA, winB) => {
        if (winA.isCurWindow) {
          return -1;
        } else if (winB.isCurWindow) {
          return 1;
        } else {
          return 0;
        }
      });

      // 将域名合并的tabs 顺序往上提
      result.forEach((window) => {
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

      return result;
    },
  },
};
</script>

<style>
/* 搜索部分 */
.search-wrapper {
  padding: 12px;
}

/* 当前窗口高亮状态 */
.status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
  background: #2d8cf0;
}

.popup-wrapper {
  width: 300px;
  height: 550px;
  background-color: #fff;
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

.menulist .ivu-icon-ios-arrow-forward {
  display: none;
}

.domain {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  word-break: break-all;
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
  padding: 3px 0 3px 12px;
  position: relative;
  background: #f3f3f5;
  border-bottom: 1px solid #eee;
}

.item .title {
  height: 100%;
  color: #555;
  width: 100%;
  font-size: 12px;
  line-height: 45px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  cursor: pointer;
}

/* 网站Icon */
.icon {
  display: inline-block;
  width: 20px;
  height: auto;
  margin-right: 6px;
  border-radius: 50%;
  border: 1px solid #dcdee2;
}

/* 删除按钮 */
.delete {
  background: #ed4014;
  width: 40px;
  height: 40px;
  opacity: 0;
  cursor: pointer;
}

.item .delete {
  position: absolute;
  right: 0;
  top: 2px;
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
</style>
