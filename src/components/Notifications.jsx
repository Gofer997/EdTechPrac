import { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, Spinner, Button } from 'react-bootstrap';
import api from '../api.js';
import 'bootstrap/dist/css/bootstrap.min.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const notificationTypeLabels = {
    'assignment_graded': 'Задание оценено',
    'assignment_submitted': 'Задание сдано',
    'lesson_graded': 'Оценка за урок',
    'new_assignment': 'Новое задание',
    'attendance_marked': 'Отметка о посещении',
    'level_up': 'Повышение уровня',
    'badge_earned': 'Получен значок',
    'crystals_awarded': 'Начислены кристаллы',
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('notifications/');
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('notifications/unread-count/');
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const markAsRead = async (ids = []) => {
    try {
      await api.post('notifications/mark-read/', { ids });
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = () => {
    markAsRead([]);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    setLoading(false);

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <Dropdown ref={dropdownRef} align="end">
      <Dropdown.Toggle variant="light" id="notification-dropdown" className="position-relative">
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <Badge
            pill
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '10px', padding: '3px 6px', minWidth: '18px' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px', maxHeight: '400px', overflowY: 'auto' }}>
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={markAllAsRead}
            >
              Отметить все
            </Button>
          )}
        </Dropdown.Header>

        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <Dropdown.Item className="text-muted text-center py-3">
            Нет уведомлений
          </Dropdown.Item>
        ) : (
          notifications.map((notification) => (
            <Dropdown.Item
              key={notification.id}
              className={`py-2 ${!notification.is_read ? 'bg-light' : ''}`}
              style={{ cursor: notification.link ? 'pointer' : 'default' }}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="fw-bold small mb-1">
                    {notification.title}
                    {!notification.is_read && (
                      <Badge bg="primary" pill className="ms-2" style={{ fontSize: '9px' }}>
                        Новое
                      </Badge>
                    )}
                  </div>
                  <div className="small text-muted mb-1">{notification.message}</div>
                  <div className="small text-muted" style={{ fontSize: '11px' }}>
                    {formatTime(notification.created_at)}
                  </div>
                </div>
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default Notifications;
