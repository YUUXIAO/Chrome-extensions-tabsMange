<template>
  <div class="edit-wrapper">
    <div class="flex-x-start">
      <Input
        size="large"
        style="width:300px"
        v-model.trim="tabGroupInfo.tabGroupName"
        clearable
        placeholder="请输入标签组名称"
      />
      <Button
        size="large"
        type="primiry"
        style="margin:0 20px"
        @click="handleName()"
      >
        保存
      </Button>
      <Button size="large" type="success" @click="openDialog('add')">
        新增标签
      </Button>
      <Button size="large" type="success" @click="handleSave()">
        保存标签组
      </Button>
    </div>
    <Divider />
    <Table
      :columns="columns"
      border
      :data="tabGroupInfo.tabList"
      width="1250"
      height="200"
    >
      <template slot-scope="{ row }" slot="name">
        <strong>{{ row.name }}</strong>
      </template>
      <template slot-scope="{ row }" slot="action">
        <Button
          type="primary"
          size="small"
          style="margin-right: 5px"
          @click="openDialog('edit', row)"
          >编辑</Button
        >
        <Button type="primary" size="small" @click="handleDelete(row)"
          >删除</Button
        >
      </template></Table
    >
    <Modal v-model="showDialog" title="编辑/新增标签" @on-ok="handleSubmit()">
      <Form
        ref="formValidate"
        :model="formControl"
        :rules="ruleValidate"
        :label-width="80"
      >
        <FormItem label="网站名称" prop="title">
          <Input
            size="large"
            v-model="formControl.title"
            placeholder="请输入网站名称"
          />
        </FormItem>
        <FormItem label="网站URL" prop="url">
          <Input
            size="large"
            v-model="formControl.url"
            placeholder="请输入网站URL"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
<script>
const tabItem = function() {
  return {
    title: '',
    url: '',
  };
};
export default {
  data() {
    return {
      tabGroupInfo: {
        tabGroupName: '',
        tabList: [],
      },
      formControl: tabItem(),
      showDialog: false, // 是否显示新增/编辑弹窗
      isEdit: false,

      ruleValidate: {
        title: [
          {
            required: true,
            message: '请输入网站名称',
            trigger: 'blur',
          },
        ],
        url: [
          {
            required: true,
            message: '请输入网站URL',
            trigger: 'blur',
          },
        ],
      },
      columns: [
        {
          type: 'index',
          width: 100,
          align: 'center',
        },
        {
          title: '网站名称',
          key: 'title',
          width: 320,
        },
        {
          title: '网站URL',
          key: 'url',
          width: 420,
        },
        {
          title: 'Action',
          key: 'action',
          slot: 'action',
        },
      ],
    };
  },
  methods: {
    // 提交信息
    handleSave() {
      chrome.storage.sync.get(['tabsGroups'], (res) => {
        console.log(res);
      });
    },
    // 打开新增/编辑弹窗
    openDialog(type, rowData) {
      const isEdit = type === 'add' ? false : true;
      if (isEdit) {
        this.formControl = JSON.parse(JSON.stringify(rowData));
      } else {
        this.formControl = Object.assign({}, tabItem(), {
          sort: this.tabGroupInfo.tabList.length,
        });
      }
      this.showDialog = true;
      this.isEdit = isEdit;
    },
    // 保存标签
    handleSubmit() {
      this.$refs.formValidate.validate((validate) => {
        if (!validate) {
          return;
        }
        if (this.isEdit) {
          const { sort } = this.formControl;
          this.tabGroupInfo.tabList.splice(sort, 1, this.formControl);
        } else {
          this.tabGroupInfo.tabList.push(this.formControl);
        }
      });
    },
    //删除标签
    handleDelete({ sort }) {
      this.tabGroupInfo.tabList.splice(sort, 1);
    },
    // 添加标签
    handleAdd() {
      const tabItem = tabItem();
      this.tabGroupInfo.tabList.push(tabItem);
    },
  },
};
</script>
