import React, { useEffect, useState, useRef } from 'react';
import { Drawer, Button, Tabs, Badge, Select, TreeSelect } from 'antd';
import { request } from '@/utils/http';
import config from '@/utils/config';
import SplitPane from 'react-split-pane';
import Editor from '@monaco-editor/react';
import SaveModal from './saveModal';
import SettingModal from './setting';
import { useTheme } from '@/utils/hooks';

const { Option } = Select;
const LangMap: any = {
  '.py': 'python',
  '.js': 'javascript',
  '.sh': 'shell',
  '.ts': 'typescript',
};
const prefixMap: any = {
  python: '.py',
  javascript: '.js',
  shell: '.sh',
  typescript: '.ts',
};

const EditModal = ({
  treeData,
  currentNode,
  content,
  handleCancel,
  visible,
  socketMessage,
}: {
  treeData?: any;
  content?: string;
  visible: boolean;
  socketMessage: any;
  currentNode: any;
  handleCancel: () => void;
}) => {
  const [value, setValue] = useState('');
  const [language, setLanguage] = useState<string>('javascript');
  const [cNode, setCNode] = useState<any>();
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false);
  const [settingModalVisible, setSettingModalVisible] =
    useState<boolean>(false);
  const [log, setLog] = useState<string>('');
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const cancel = () => {
    handleCancel();
  };

  const onSelect = (value: any, node: any) => {
    if (node.key === selectedKey || !value) {
      return;
    }
    const newMode = LangMap[value.slice(-3)] || '';
    setCNode(node);
    setLanguage(newMode);
    getDetail(node);
    setSelectedKey(node.key);
  };

  const getDetail = (node: any) => {
    request
      .get(`${config.apiPrefix}scripts/${node.value}?path=${node.parent || ''}`)
      .then((data) => {
        setValue(data.data);
      });
  };

  const run = () => {
    setLog('');
    request
      .put(`${config.apiPrefix}scripts/run`, {
        data: {
          filename: cNode.value,
          path: cNode.parent || '',
        },
      })
      .then((data) => {});
  };

  useEffect(() => {
    if (!socketMessage) {
      return;
    }

    let { type, message: _message, references } = socketMessage;

    if (type !== 'manuallyRunScript') {
      return;
    }

    if (log) {
      _message = `\n${_message}`;
    }
    setLog(`${log}${_message}`);
  }, [socketMessage]);

  useEffect(() => {
    if (currentNode) {
      setCNode(currentNode);
      setValue(content as string);
      setSelectedKey(currentNode.key);
    }
  }, [content, currentNode]);

  return (
    <Drawer
      className="edit-modal"
      closable={false}
      title={
        <>
          <TreeSelect
            style={{ marginRight: 8, width: 150 }}
            value={selectedKey}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            treeData={treeData}
            placeholder="请选择脚本文件"
            showSearch
            onSelect={onSelect}
          />
          <Select
            value={language}
            style={{ width: 110, marginRight: 8 }}
            onChange={(e) => {
              setLanguage(e);
            }}
          >
            <Option value="javascript">javascript</Option>
            <Option value="typescript">typescript</Option>
            <Option value="shell">shell</Option>
            <Option value="python">python</Option>
          </Select>
          <Button type="primary" style={{ marginRight: 8 }} onClick={run}>
            运行
          </Button>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setLog('');
            }}
          >
            清空日志
          </Button>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setSettingModalVisible(true);
            }}
          >
            设置
          </Button>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              setSaveModalVisible(true);
            }}
          >
            保存
          </Button>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => {
              handleCancel();
            }}
          >
            退出
          </Button>
        </>
      }
      width={'100%'}
      headerStyle={{ padding: '11px 24px' }}
      onClose={cancel}
      visible={visible}
    >
      <SplitPane split="vertical" minSize={200} defaultSize="50%">
        <Editor
          language={language}
          value={value}
          theme={theme}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            lineNumbersMinChars: 3,
            glyphMargin: false,
          }}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
        <div>
          <pre>{log}</pre>
        </div>
      </SplitPane>
      <SaveModal
        visible={saveModalVisible}
        handleCancel={() => {
          setSaveModalVisible(false);
        }}
        file={{
          content:
            editorRef.current &&
            editorRef.current.getValue().replace(/\r\n/g, '\n'),
          filename: cNode?.value,
        }}
      />
      <SettingModal
        visible={settingModalVisible}
        handleCancel={() => {
          setSettingModalVisible(false);
        }}
      />
    </Drawer>
  );
};

export default EditModal;
