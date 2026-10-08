import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Statistic, Typography, Spin, Segmented, DatePicker, message } from "antd";
import { BarChartOutlined, BookOutlined } from "@ant-design/icons";
import { Column } from "@ant-design/charts";
import dayjs from "dayjs";
import { requestGetStats } from "../../../../config/request";
import styles from "./DashBoard.module.scss";
import classNames from "classnames/bind";

const { Title } = Typography;
const cx = classNames.bind(styles);

// === Helpers ===
const buildDaysOfMonth = (anyDay) => {
  const days = [];
  let d = anyDay.startOf("month");
  const end = anyDay.endOf("month");
  while (d.isBefore(end, "day") || d.isSame(end, "day")) {
    days.push(d.format("YYYY-MM-DD"));
    d = d.add(1, "day");
  }
  return days;
};

const buildMonthsOfYear = (anyDay) => {
  const arr = [];
  let m = anyDay.startOf("year");
  const end = anyDay.endOf("year");
  while (m.isBefore(end, "month") || m.isSame(end, "month")) {
    arr.push(m.format("YYYY-MM"));
    m = m.add(1, "month");
  }
  return arr;
};

export default function DashBoard() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("day"); // day | month
  const [anchorDate, setAnchorDate] = useState(dayjs());
  const [totals, setTotals] = useState({
    totalTitles: 0,
    totalCopies: 0,
    totalBorrowed: 0,
  });
  const [seriesRaw, setSeriesRaw] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let from, to, granularity;
        if (mode === "day") {
          from = anchorDate.startOf("month").format("YYYY-MM-DD");
          to = anchorDate.endOf("month").format("YYYY-MM-DD");
          granularity = "day";
        } else {
          from = anchorDate.startOf("year").format("YYYY-MM-DD");
          to = anchorDate.endOf("year").format("YYYY-MM-DD");
          granularity = "month";
        }

        const res = await requestGetStats({ from, to, granularity });
        const md = res?.metadata || {};

        setTotals({
          totalTitles: md?.library?.totalTitles ?? 0,
          totalCopies: md?.library?.totalCopies ?? 0,
          totalBorrowed: md?.borrowed?.totalBorrowedInRange ?? 0,
        });

        setSeriesRaw(
          Array.isArray(md?.series?.borrowedSeries)
            ? md.series.borrowedSeries
            : []
        );
      } catch (err) {
        console.error(err);
        message.error("Không thể tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [mode, anchorDate]);

  const chartData = useMemo(() => {
    const map = new Map(
      seriesRaw.map((s) => [String(s.period), Number(s.totalBorrowed) || 0])
    );
    const buckets =
      mode === "day"
        ? buildDaysOfMonth(anchorDate)
        : buildMonthsOfYear(anchorDate);

    return buckets.map((key) => ({
      period: key,
      value: map.get(key) ?? 0,
    }));
  }, [seriesRaw, mode, anchorDate]);

  // === Cấu hình biểu đồ (không tooltip, có label giá trị) ===
  const columnConfig = {
    data: chartData,
    xField: "period",
    yField: "value",
    columnWidthRatio: 0.6,
    color: "#1677ff",
    xAxis: {
      label: {
        autoRotate: true,
        formatter: (txt) =>
          mode === "day"
            ? dayjs(txt).format("DD/MM")
            : dayjs(txt + "-01").format("MM/YYYY"),
      },
      title: {
        text: mode === "day" ? "Ngày trong tháng" : "Tháng trong năm",
      },
    },
    yAxis: {
      title: { text: "Số sách mượn" },
    },
    tooltip: false, // ❌ tắt tooltip
    label: {
      position: "top", // ✅ hiện giá trị trên đầu cột
      style: {
        fill: "#000",
        fontSize: 12,
        fontWeight: 500,
      },
      formatter: (d) => d.value || "", // ẩn nếu = 0
    },
    meta: {
      period: { alias: mode === "day" ? "Ngày" : "Tháng" },
      value: { alias: "Số lượng" },
    },
    padding: "auto",
  };

  return (
    <div className={cx("wrapper")}>
      <Title level={2}>
        <BarChartOutlined className="me-2" />
        Thống kê mượn sách
      </Title>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Segmented
          options={[
            { label: "Theo ngày", value: "day" },
            { label: "Theo tháng", value: "month" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <DatePicker
          picker={mode === "month" ? "year" : mode}
          value={anchorDate}
          onChange={(d) => setAnchorDate(d || dayjs())}
          format={mode === "day" ? "MM/YYYY" : "YYYY"}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Tổng đầu sách"
                  value={totals.totalTitles}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Tổng số sách có trong thư viện"
                  value={totals.totalCopies}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Tổng số sách đang mượn"
                  value={totals.totalBorrowed}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Biểu đồ thống kê" bordered={false}>
            {chartData?.length ? (
              <Column {...columnConfig} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu để hiển thị
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
