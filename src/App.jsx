// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Spin, Alert, Typography, Button, Input, Space, Image, 
  Layout, Card, Tooltip 
} from 'antd'; 
import { DownloadOutlined, SearchOutlined, YoutubeFilled } from '@ant-design/icons';
import Papa from 'papaparse';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// --- CẤU HÌNH CỦA BẠN ---
const GOOGLE_SHEET_CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;
const LINK4M_API_KEY = import.meta.env.VITE_LINK4M_API_KEY;
const LOGO_URL = import.meta.env.VITE_LOGO_URL;
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;
const YOUTUBE_TUTORIAL_URL = 'https://youtu.be/A-aGo07zcD8?si=L8_tmK5kw3vA9qHy';
// -------------------------

function normalizeString(str) {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
}
const AppHeader = () => (
  <Header className="app-header">
    <div className="header-content">
      {/* ===== THAY ĐỔI Ở ĐÂY ===== */}
      {/* Bỏ <Space>, thay bằng <div> với className để style bằng CSS */}
      <div className="logo-and-title">
        <Image height={40} src={LOGO_URL} preview={false} alt="Logo" />
        <Title level={3} style={{ marginBottom: 0, marginLeft: '12px' }}>
          Thư Viện Tài Liệu
        </Title> 
      </div>
      {/* =========================== */}
      
      <Tooltip title="Xem video hướng dẫn tải tài liệu">
        <Button
          className="youtube-button pulse"
          type="primary"
          danger
          icon={<YoutubeFilled />}
          size="large"
          href={YOUTUBE_TUTORIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Hướng Dẫn
        </Button>
      </Tooltip>
    </div>
  </Header>
);


function App() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShortening, setIsShortening] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Các hàm logic (handleDownloadClick, useEffect, handleSearch...) giữ nguyên không đổi
  const handleDownloadClick = async (driveLink, recordKey) => {
    setIsShortening(recordKey);
    try {
      const encodedDriveLink = encodeURIComponent(driveLink);
      const apiUrl = `${BACKEND_API_URL}/api/shorten?api=${LINK4M_API_KEY}&url=${encodedDriveLink}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Yêu cầu API thất bại (status: ${response.status})`);
      const result = await response.json();
      if (result.status === 'success' && result.shortenedUrl) {
        window.open(result.shortenedUrl, '_blank');
      } else {
        throw new Error(result.message || 'Không nhận được link rút gọn hợp lệ');
      }
    } catch (apiError) {
      console.error("Lỗi khi tạo link rút gọn:", apiError);
      alert(`Đã có lỗi xảy ra khi tạo link tải xuống: ${apiError.message}`);
    } finally {
      setIsShortening(null);
    }
  };

  useEffect(() => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (Array.isArray(results.data)) {
          const formattedData = results.data
            .filter(row => row.id && row.tenHocPhan && row.linkDrive)
            .map(row => ({
              key: row.id,
              stt: parseInt(row.id, 10),
              tenHocPhan: row.tenHocPhan.trim(),
              linkDrive: row.linkDrive.trim()
            }))
            .sort((a, b) => a.stt - b.stt);
          
          setOriginalData(formattedData);
          setFilteredData(formattedData);
        } else {
          setError('Dữ liệu trả về không đúng định dạng.');
        }
        setLoading(false);
      },
      error: (err) => {
        setError('Không thể tải dữ liệu từ Google Sheets.');
        setLoading(false);
      }
    });
  }, []);

  const handleSearch = () => {
    if (!searchText) {
      setFilteredData(originalData);
      return;
    }
    const normalizedSearchText = normalizeString(searchText);
    const result = originalData.filter(item => {
      const normalizedItemName = normalizeString(item.tenHocPhan);
      return normalizedItemName.includes(normalizedSearchText);
    });
    setFilteredData(result);
  };
  
  const handleKeyPress = (e) => { if (e.key === 'Enter') { handleSearch(); } };

  // Cột của bảng
  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: 80, align: 'center' },
    { title: 'Tên Học Phần', dataIndex: 'tenHocPhan', key: 'tenHocPhan' },
    {
      title: 'Tải xuống (Có quảng cáo)',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Button type="primary" icon={<DownloadOutlined />} loading={isShortening === record.key} onClick={() => handleDownloadClick(record.linkDrive, record.key)}>
          Tải về
        </Button>
      ),
    },
  ];

  if (loading) return <div className="app-loading"><Spin size="large" tip="Đang tải danh sách tài liệu..." /></div>;
  if (error) return <div className="app-container"><Alert message="Lỗi" description={error} type="error" showIcon /></div>;

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="app-content">
        <Card>
          <div className="search-bar-container">
            <Title level={4}>Tìm kiếm tài liệu</Title>
            <Space.Compact style={{ width: '100%', maxWidth: '500px' }}>
              <Input 
                placeholder="Nhập tên học phần..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={handleKeyPress}
                allowClear
                size="large"
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="large">
                Tìm kiếm
              </Button>
            </Space.Compact>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={filteredData}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            bordered
            scroll={{ x: 'max-content' }} // Cho phép cuộn ngang trên mobile
            style={{ marginTop: '24px' }}
          />
        </Card>
      </Content>
    </Layout>
  );
}

export default App;