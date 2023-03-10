import "./MasterAntList.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Table, Popconfirm, Button, Space, Form, Input } from "antd";
import axios from "axios";
import { filter, isEmpty } from "lodash";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { CSVLink } from "react-csv";



const MasterAntList = () => {
  const [gridData, setgridData] = useState([]);
  const [loading, setloading] = useState(false);
  const [editRowKey, seteditRowKey] = useState("");
  const [sortedInfo, setsortedInfo] = useState({});
  const [searchText, setsearchText] = useState("");
  const [searchColText, setSearchColText] = useState("");
  const [searchedCol, setSearchedCol] = useState("");
  const [filteredInfo, setFilteredInfo] = useState({});
  const [showFilter, setShowFilter] = useState(true);

  const type ="DraggableBodyRow"
  const tableRef = useRef()
  const searchInput = useRef(null);

  // let [filteredData] = useState([]);
  let filteredData = [];

  const [form] = Form.useForm();

  const loadData = async () => {
    setloading(true);
    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/comments"
    );
    setgridData(response.data);
    setloading(false);
  };

  const dataWithAge = gridData.map((item) => ({
    ...item,
    age: Math.floor(Math.random() * 6) + 20,
  }));
  const modifiedData = dataWithAge.map(({ body, ...item }) => ({
    ...item,
    key: item.id,
    info: `My name is ${item.email.split("@")[0]} and i am ${
      item.age
    } year old`,
    message: isEmpty(body) ? item.message : body,
  }));


const DraggableBodyRow =({
  index,
  moveRow,
  className,
  style,
  ...restProps
})=>{
  const ref = useRef()
  
  const[{isOver, dropClassName}, drop] = useDrop({
    accept:type,
    collect:(monitor)=>{
      const {index:dragIndex} =monitor.getItem() || {}
      if(dragIndex === index){
        return {}
      }
      return {
        isOver:monitor.isOver(),
        dropClassName:dragIndex<index?"drop-down-downward":"drop-over-upward"
      }
    },
    drop:(item)=>{
      moveRow(item.index, index)
    }

  })
  const [,drag]= useDrag({
    type,
    item:{index},
    collect:(monitor)=>{
      isDragging:monitor.isDragging()
    }
  })
  drop(drag(ref))
  return(
    <tr
     ref={ref}
     className ={`${className}${isOver?dropClassName:""}`}
     style={{cursor:"move",...style}}
   {...restProps}
    
    />
  
  )
}
const moveRow = useCallback((dragIndex, hoverIndex)=>{
  const dragRow = modifiedData[dragIndex]
  setgridData(update(modifiedData,{
    $splice:[
      [dragIndex,1],
      [hoverIndex,0,dragRow],
    ],
  }

  ))
},
[modifiedData]
)


  useEffect(() => {
    loadData();
  }, []);


  // console.log("modifiedData===",modifiedData);

  const handleDelete = (value) => {
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((item) => item.id !== value.id);
    setgridData(filteredData);
  };

  const isEditing = (record) => {
    return record.key === editRowKey;
  };

  // console.log("isEditing---",isEditing)
  // console.log("editing---",editable)

  const cancel = () => {
    seteditRowKey("");
  };
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...modifiedData];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setgridData(newData);
        seteditRowKey("");
      }
    } catch (error) {
      console.log("error in MasterAntList--", error);
    }
  };
  const edit = (record) => {
   // console.log("record inside edit functon--", record);
    form.setFieldsValue({
      name: "",
      email: "",
      message: "",
      ...record,
    });
    seteditRowKey(record.key);
  };

  const handleChange = (_,filters,sorter) => {
   // console.log("sorter==", sorter);
    const { order, field } = sorter;
    setFilteredInfo(filters)
    //console.log("filterinfo--",filteredInfo)
    setsortedInfo({ columnKey: field, order });
  };
  const reset = () => {
    setsortedInfo({});
    setFilteredInfo({})

    setsearchText("");
    filteredData = [];
    loadData();
  };

  const handleChangeOfInput = (e) => {
    setsearchText(e.target.value);
    // console.log("searchtext--", searchText)
    if (e.target.value === "") {
      loadData();
    }
  };

  const globalSearch = () => {
    modifiedData.forEach((value) => {

      if (
        value.email.toLowerCase().includes(searchText.toLowerCase()) ||
        value.name.toLowerCase().includes(searchText.toLowerCase()) ||
        value.message.toLowerCase().includes(searchText.toLowerCase())
      ) {
     
        filteredData.push(value);
      }

    });
    // console.log("filteredData=== inside global seardch", filteredData);

    filteredData && setgridData(filteredData);
  };
  // console.log("filteredData===", filteredData);


  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
         ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 0, display: "block" }}
        />
        <Space style={{ marginTop: 4 }}>
          <Button
            type="primary"
            onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleResetCol(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
        
    render: (text) =>
      searchedCol === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchColText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
    setShowFilter(false);
    confirm();
   
    // console.log("showfilter--insisee  handleSearchCol ", showFilter)
    // console.log("confirm--insisee  handleSearchCol ", confirm)
    // console.log("dataIndex--insisee  handleSearchCol ", dataIndex)
    // console.log("selectedKeys--insisee  handleSearchCol ", selectedKeys)



    setSearchColText(selectedKeys[0]);
    setSearchedCol(dataIndex);
  };

  const handleResetCol = (clearFilters) => {
    clearFilters();
    setSearchColText("");
    setShowFilter(true);
  };



const filterObject = {      filters: [
  { text: "20", value: "20" },
  { text: "21", value: "21" },
  { text: "22", value: "22" },
  { text: "23", value: "23" },
  { text: "24", value: "24" },
  { text: "25", value: "25" },
],
filteredValue: filteredInfo.age || null,
 onFilter:(value,record)=>String(record.age).includes(value),}


const showFilterAge = showFilter?filterObject:null







  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      align: "center",
      editable: true,
      sorter: (a, b) => a.name.length - b.name.length,
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      sortDirections: ['descend', 'ascend'],
      filteredValue: filteredInfo.name || null,
      ...getColumnSearchProps("name"),
      




 
      // ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      align: "center",
      editable: true,
      sorter: (a, b) => a.email.length - b.email.length,
      sortOrder: sortedInfo.columnKey === "email" && sortedInfo.order,
      sortDirections: ['descend', 'ascend'],
      filteredValue: filteredInfo.email || null,

      ...getColumnSearchProps("email"),
    
    },
    {
      title: "Age",
      dataIndex: "age",
      align: "center",
      editable: false,
      sorter: (a, b) => a.age - b.age,
      sortOrder: sortedInfo.columnKey === "age" && sortedInfo.order,
      sortDirections: ['descend', 'ascend'],
  
   ...showFilterAge,

      

    },
    {
      title: "Message",
      dataIndex: "message",
      align: "center",
      editable: true,
      sorter: (a, b) => a.message.length - b.message.length,
      sortOrder: sortedInfo.columnKey === "message" && sortedInfo.order,
      sortDirections: ['descend', 'ascend'],
      filteredValue: filteredInfo.message || null,

      ...getColumnSearchProps("message"),
 
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      render: (_, record) => {
        const editable = isEditing(record);

        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title=" Are you sure you want to delete"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger type="primary" disabled={editable}>
                Delete
              </Button>
            </Popconfirm>
            {editable ? (
              <span>
                <Space size="middle">
                  <Button
                    onClick={() => save(record.key)}
                    type="primary"
                    style={{ marginRight: 8 }}
                  >
                    save
                  </Button>
                  <Popconfirm
                    title="Are you sure to cancel ?"
                    onConfirm={cancel}
                  >
                    <Button o onConfirm={() => cancel(record)}>
                      cancel
                    </Button>
                  </Popconfirm>
                </Space>
              </span>
            ) : (
              <Button onClick={() => edit(record)} type="primary">
                Edit
              </Button>
            )}
          </Space>
        ) : null;
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  const EditableCell = ({
    editing,
    dataIndex,
    title,
    record,
    children,
    ...restProps
  }) => {
    const input = <Input />;

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `please input some value for ${title}`,
              },
            ]}
          >
            {input}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

 
  return (
    <div>
      <div className="topSpacein_and_master_list">
        <Space style={{ marginBottom: 10 }}>
          <Input
            placeholder="Enter the search text"
            onChange={handleChangeOfInput}
            allowClear
            type="text"
            value={searchText}
          />
          <Button onClick={globalSearch} type="primary">
            search
          </Button>

          <Button onClick={reset}>Reset</Button>
          <Button style={{backgroundColor:"#c2115e",color:'#fff'}}>
            <CSVLink data={
              
              filteredData&&filteredData.length ?filteredData :modifiedData  

            
            }>Export</CSVLink>
          </Button>

        </Space>
      </div>

      <Form form={form} component={false}>
        {/* <DndProvider backend={HTML5Backend}> */}
   
      
        <Table
          // columns={columns}
    //  ref={tableRef}
          columns={mergedColumns}
          components={{
            body: {
              cell: EditableCell,
              // row:DraggableBodyRow,
            },
          }}
          // onRow={(record, index) => ({
          //   index,
          //   moveRow,
          // })}
          dataSource={
            filteredData && filteredData.length ? filteredData : modifiedData
          }
      
          expandable={{
            expandedRowRender: (record) => (
              <p style={{ margin: 0 }}>{record.info}</p>
            ),
            rowExpandable: (record) => record.info !== "Not Expandable",
          }}
          bordered
          loading={loading}
          onChange={handleChange}
          pagination={{ position: ["bottomCenter"] }}
        />
          {/* </DndProvider> */}
      </Form>
    </div>
  );
};

export default MasterAntList;
