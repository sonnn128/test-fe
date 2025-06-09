// src/App.jsx
import React, { useState, useEffect } from 'react';
// Thêm 'Image' và 'Space' từ antd
import { Table, Spin, Alert, Typography, Button, Input, Space, Image } from 'antd'; 
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import './App.css';

const { Title, Text } = Typography;

// --- CẤU HÌNH CỦA BẠN ---
// -------------------------

const GOOGLE_SHEET_CSV_URL = import.meta.env.VITE_GOOGLE_SHEET_CSV_URL;
const LINK4M_API_KEY = import.meta.env.VITE_LINK4M_API_KEY;
const LOGO_URL = import.meta.env.VITE_LOGO_URL;
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

function App() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShortening, setIsShortening] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Hàm gọi API của link4m
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

  // Tải và xử lý dữ liệu
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

  // Hàm tìm kiếm
  const handleSearch = () => {
    if (!searchText) {
      setFilteredData(originalData);
      return;
    }
    const lowercasedFilter = searchText.toLowerCase();
    const result = originalData.filter(item =>
      item.tenHocPhan.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredData(result);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', width: '10%', align: 'center' },
    { title: 'Tên Học Phần', dataIndex: 'tenHocPhan', key: 'tenHocPhan', width: '60%' },
    {
      title: 'Tải xuống ( Có quảng cáo)',
      key: 'action',
      width: '30%',
      align: 'center',
      render: (_, record) => (
        <Button type="primary" icon={<DownloadOutlined />} loading={isShortening === record.key} onClick={() => handleDownloadClick(record.linkDrive, record.key)}>
          Tải về
        </Button>
      ),
    },
  ];

  if (loading) return <div className="container loading-container"><Spin size="large" tip="Đang tải danh sách tài liệu..." /></div>;
  if (error) return <div className="container"><Alert message="Lỗi" description={error} type="error" showIcon /></div>;

  return (
    <div className="container">
      {/* ===== PHẦN TIÊU ĐỀ ĐÃ ĐƯỢC CẬP NHẬT ===== */}
      <Space align="center" size="large">
        <Image
          height={60} // Điều chỉnh chiều cao của logo
          src={LOGO_URL}
          preview={false} // Tắt chức năng xem trước ảnh khi bấm vào
          alt="Logo trường"
        />
        <Title level={2} style={{ marginBottom: 0 }}>Thư Viện Tài Liệu</Title>
      </Space>
      <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
        Tổng hợp tài liệu các học phần, đề thi và bài giảng
      </Text>
      {/* ========================================= */}
      
      <Space.Compact style={{ width: '60%', marginTop: '24px' }}>
        <Input 
          placeholder="Nhập tên học phần cần tìm..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={handleKeyPress}
          allowClear // Thêm nút xóa nhanh
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </Space.Compact>
      
      <Table 
        columns={columns} 
        dataSource={filteredData}
        pagination={{ pageSize: 15, showSizeChanger: false }}
        bordered
        style={{ marginTop: '16px' }}
      />
    </div>
  );
}

export default App;