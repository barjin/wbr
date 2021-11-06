import React, {createRef} from 'react';
import './index.css';

import 'antd/dist/antd.css';
import { Layout, Menu, Breadcrumb, 
  Table, Row, Col, 
  Form, Slider, Switch, 
  Radio, Button, Input, Tooltip, Card } from 'antd';

import {
  SettingOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  BugOutlined,
  ReloadOutlined,
  HighlightOutlined,
  BulbOutlined,
  SearchOutlined,
  LockOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  Loading3QuartersOutlined as LoadingOutlined
} from '@ant-design/icons';

import {
  BrowserRouter as Router,
  Route,
  Switch as RouteSwitch,
  Link
} from "react-router-dom";

import {io} from "socket.io-client";
import LZUTF8 from 'lzutf8';

import SelectorGenerator from './selgen';

const { Header, Content, Footer, Sider } = Layout;


class OptionsMenu extends React.Component{
  state = {
    experimentals : false
  }
  render() {
    return (
    <>
    <Breadcrumb style={{ margin: '0 0 16px 0' }}>
      <Breadcrumb.Item>WBR</Breadcrumb.Item>
      <Breadcrumb.Item>Settings</Breadcrumb.Item>
      </Breadcrumb>
    <Row>
      <Col md={12}>
        <p><b>Basic settings:</b></p>
        <Form 
        labelCol={{ span: 8 }}
        wrapperCol={{span: 16}}
        >
          <Form.Item
            label='Auto Step Suggestions'
          >
            <Switch/>
          </Form.Item>
          <Form.Item
            label='Crawl (Element) Suggestions'
          >
            <Switch/>
          </Form.Item>
          <Form.Item
            label='Transmission quality'
          >
            <Slider min={20} defaultValue={70} disabled={this.state.experimentals} />
          </Form.Item>

          <Form.Item
            label='Sync Recordings with server'
          >
            <Switch/>
          </Form.Item>
        </Form>
        
      </Col>
      <Col md={12}>
        <p><b>Experimental features:</b></p>
        <Form 
        labelCol={{ span: 8 }}
        wrapperCol={{span: 16}}
        >
          <Form.Item
            label='DOM Hybrid Transfer'
          >
            <Switch/>
          </Form.Item>
          <Form.Item
            label='Smart Proxy'
          >
          <Radio.Group>
            <Radio.Button value="auto">Auto (CORS detect)</Radio.Button>
            <Radio.Button value>Always</Radio.Button>
            <Radio.Button value={false}>Never</Radio.Button>
          </Radio.Group>
          </Form.Item>
          <Form.Item
            label='CORS Detection'
          >
          <Switch/>
          </Form.Item>
        </Form>
      </Col>
    </Row>
    </>
    );
  }
}

class RecordingTable extends React.Component{
  render(){
    const states = [
      {
        name: 'Enqueued',
        icon: '📥'
      },
      {
        name: 'Running',
        icon: <LoadingOutlined spin/>
      },
      {
        name: 'Passed',
        icon: '✔'
      },
      {
        name: 'Failed',
        icon: '❌'
      },
    ]
    const data = [
      {
        state: 'Enqueued',
        key: '1',
        name: 'Train tickets',
        date: 1635707568
      },
      {
        state: 'Failed',
        key: '2',
        name: 'Slack integration',
        date: 1625706000
      },
      {
        state: 'Running',
        key: '3',
        name: 'Unsubscribe flow',
        date: 1634704000
      },
      {
        state: 'Passed',
        key: '4',
        name: 'Scrape news',
        date: 1634700000
      },
      {
        state: 'Running',
        key: '5',
        name: 'Real estate scraper',
        date: 1634704000
      }
    ];

    const columns = [
      {
        width: 10,
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        render: (state : string) => <Tooltip title={states.find(x => x.name === state)!.name}>{states.find(x => x.name === state)!.icon}</Tooltip>
      },
      {
        title: 'Recording name',
        dataIndex: 'name',
        key: 'name',
        render: (name : string, row : typeof data[0]) => <Link to={`recording/${row.key}`}>{name}</Link>
      },
      {
        title: 'Updated on',
        dataIndex: 'date',
        key: 'date',
        render: (date: number) => <p>{new Date(date*1000).toLocaleString()}</p>
      }
    ];
    return (
      <>
      <Breadcrumb style={{ margin: '0 0 16px 0' }}>
      <Breadcrumb.Item>WBR</Breadcrumb.Item>
      <Breadcrumb.Item>Recordings</Breadcrumb.Item>
      </Breadcrumb>
      <Table columns={columns} dataSource={data.sort((a,b) => states.findIndex(x => a.state === x.name) - states.findIndex(x => b.state === x.name))} />
      </>
    )
  }
}

class RemoteBrowser extends React.Component{
  private frame : React.RefObject<HTMLIFrameElement>;

  constructor(props: any){
    super(props);
    this.state = {
      address: props.address,
      socket: null
    }
    this.frame = createRef();
  }

  componentDidMount(){
    const doc = this.frame.current?.contentDocument;
    doc?.open();
    doc?.write(`
    <style>
    .lds-roller {
      display: inline-block;
      position: relative;
      width: 80px;
      height: 80px;
    }
    .lds-roller div {
      animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      transform-origin: 40px 40px;
    }
    .lds-roller div:after {
      content: " ";
      display: block;
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #000;
      margin: -4px 0 0 -4px;
    }
    .lds-roller div:nth-child(1) {
      animation-delay: -0.036s;
    }
    .lds-roller div:nth-child(1):after {
      top: 63px;
      left: 63px;
    }
    .lds-roller div:nth-child(2) {
      animation-delay: -0.072s;
    }
    .lds-roller div:nth-child(2):after {
      top: 68px;
      left: 56px;
    }
    .lds-roller div:nth-child(3) {
      animation-delay: -0.108s;
    }
    .lds-roller div:nth-child(3):after {
      top: 71px;
      left: 48px;
    }
    .lds-roller div:nth-child(4) {
      animation-delay: -0.144s;
    }
    .lds-roller div:nth-child(4):after {
      top: 72px;
      left: 40px;
    }
    .lds-roller div:nth-child(5) {
      animation-delay: -0.18s;
    }
    .lds-roller div:nth-child(5):after {
      top: 71px;
      left: 32px;
    }
    .lds-roller div:nth-child(6) {
      animation-delay: -0.216s;
    }
    .lds-roller div:nth-child(6):after {
      top: 68px;
      left: 24px;
    }
    .lds-roller div:nth-child(7) {
      animation-delay: -0.252s;
    }
    .lds-roller div:nth-child(7):after {
      top: 63px;
      left: 17px;
    }
    .lds-roller div:nth-child(8) {
      animation-delay: -0.288s;
    }
    .lds-roller div:nth-child(8):after {
      top: 56px;
      left: 12px;
    }
    @keyframes lds-roller {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    </style>
    <div style='width: 100%; box-sizing: border-box; text-align: center; padding-top: 45vh'>
    <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    </div>
    `);
    doc?.close();

    const socket = io('http://localhost:8000');

    const loadPage = (data : any) => {
      data = LZUTF8.decompress(new Uint8Array(data)); // string compression for shrinking the transferred data.
      const screen = this.frame.current;
  
      if(screen && screen.contentWindow){
        screen.contentWindow.document.body.innerHTML = data;
  
        if(!(screen.contentWindow.document as any).WBRClickListener){
          (screen.contentWindow.document as any).WBRClickListener = true;
          screen.contentWindow.document.body.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            let selector = SelectorGenerator.GetSelectorStructural(e.target as Element);
            socket.emit('control', {
              type: 'click',
              data: {'selector': selector}
            });
          },true);
        }
        console.log("Page Loaded!");
      }
    }

    const mutate = (data: any) => {
      console.log(data);
      const screen = this.frame.current;

      if(screen && screen.contentWindow){
        data.forEach((mutation : any) => {
          if(mutation.type !== 'attributes'){
            return;
          }
          try{
          let element = screen.contentWindow!.document.querySelector(mutation.selector);
          if(element){
            element.setAttribute(mutation.attributeName, mutation.attributeValue);
            console.log(`Setting ${element}'s' ${mutation.attributeName} to ${mutation.attributeValue}`);
          }
          }
          catch(e){
            console.log(e);
          }
        })
      }
    }

    socket.on('LoadPage', loadPage);
    socket.on('Mutation', mutate);

    this.setState({socket: socket});
  }

  gotoURL = (url: string) => {
    (this.state as any).socket.emit('control', {
      type: 'goto',
      data: {'url': url}
    });
  };

  goBack = () => {
    (this.state as any).socket.emit('control', {
      type: 'goBack',
      data: {}
    });
  }

  goForward = () => {
    (this.state as any).socket.emit('control', {
      type: 'goForward',
      data: {}
    });
  }

  render(){
    return(
      <>
      <div style={{display: 'flex', width: '100%'}}>
      <Button shape='circle' icon={<LeftOutlined/>} onClick={this.goBack}/>
      <Button shape='circle' icon={<RightOutlined/>} onClick={this.goForward}/>
    <Form onFinish={
      (values) => {
        this.gotoURL(values.address);
      }
    }
    style={{
      flex: 1,
      marginLeft: '10px'
    }}
    >
        <Form.Item name="address">
      <Input />
      </Form.Item>
      
    </Form>
    </div>
    <iframe 
      ref={this.frame} 
      tabIndex={-1} 
      width={1280}
      height={720}
      style={{width: '100%', border: '0px', backgroundColor: '#e8e8e8', flex: 1}}
    >
    </iframe>
    </>
    );
  }
}

class RecordingEditScreen extends React.Component{
  render(){
    const tools = [
      {
        name: 'Suggestions',
        icon: <BulbOutlined/>
      },
      {
        name: 'Toggle highlighting',
        icon: <HighlightOutlined/>
      },
      {
        name: 'Credentials vault',
        icon: <LockOutlined/>
      },
      {
        name: 'Scan webpage',
        icon: <SearchOutlined/>
      },
      {
        name: 'Human settings',
        icon: <UserOutlined/>
      },
    ]
    const controls = [
      {
        name: 'Pause',
        icon: <PauseCircleOutlined/>
      },
      {
        name: 'Step-by-step',
        icon: <StepForwardOutlined/>
      },
      {
        name: 'Debugging mode',
        icon: <BugOutlined/>
      },
      {
        name: 'Reconnect',
        icon: <ReloadOutlined/>
      }
    ]

    const steps = [
      {
        title: 'On: Init',
        content: 'Login'
      },
      {
        title: 'On: wikipedia.org',
        content: 'Click "en"'
      },
      {
        title: 'On: en.wikipedia.org',
        content: 'Scrape "#ul > li"'
      },
    ];
    return (
      <>
      <Row gutter={16} style={{height: '100%'}}>
        <Col span={20} style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
          <RemoteBrowser/>
        </Col>
        <Col span={4} style={{display: 'flex', flexDirection: 'column'}}>
          <Row gutter={[0,24]}>
            <Col span={24} style={{justifyContent: 'space-between'}}>
              <Button type='primary' style={{width: '100%'}} size='large' icon={<PlayCircleOutlined />}>Play</Button>
              {controls.map(control => (
                <Tooltip title={control.name}>
                  <Button style={{width: `${Math.max(100/5, 100/controls.length)}%`}} size='large' icon={control.icon} />
                </Tooltip>
              ))}
            </Col>
          </Row>
          <Row style={{marginTop: '16px', flex: 'auto'}}>
            <Col span={24}>
                {steps.map(step => (
                  <Card size='small' title={step.title} style={{marginBottom: '5px'}}>
                    {step.content}
                  </Card>
                ))}
            </Col>
          </Row>
          <Row style={{marginTop: '16px'}}>
            <Col span={24}>
              {tools.map(tool => (
                <Tooltip title={tool.name}>
                  <Button type='ghost' style={{width: `${Math.max(100/5, 100/tools.length)}%`}} size='large' icon={tool.icon} />
                </Tooltip>
              ))}
            </Col>
          </Row>
        </Col>
      </Row>
      </>
    )
  }
}

class App extends React.Component {
  state = {
    collapsed: false,
  };

  onCollapse = (collapsed : any) => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  render() {
    const { collapsed } = this.state;
    const pages = [
    {
      menuItem: 'Recordings',
      icon: <VideoCameraOutlined />,
      link: '/'
    }, 
    {
      menuItem: 'Settings',
      icon: <SettingOutlined />,
      link: '/settings'
    }];

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Router>
        <Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
          <div className="logo" />
          <Menu theme="dark" defaultSelectedKeys={['0']} mode="inline">
            {
              pages.map((x,idx) => (
                <Menu.Item key={idx} icon={x.icon}>
                  <Link to={x.link}>{x.menuItem}</Link>
                </Menu.Item>
              ))
            }
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0, paddingLeft: '20px', color: 'white' }} >
            <b>WBR v0.1.0</b>
          </Header>
          <Content style={{ margin: '16px 16px' }}>
            
              <RouteSwitch>
              <Route path='/recording'>
                <RecordingEditScreen/>
              </Route>
              <Route path='/settings'>
                <OptionsMenu/>
              </Route>
              <Route path='/'>
                <RecordingTable/>
              </Route>
              </RouteSwitch>
            
          </Content>
          
          <Footer style={{ textAlign: 'center' }}>Running on WBR 0.1.0 <br></br> Jindřich Bär (<a href="https://github.com/barjin/">barjin</a>), 2021</Footer>
        </Layout>
        </Router>
      </Layout>
    );
  }
}

export default App;
