import { useState, useEffect } from 'react';
import api from "../api.js";
import Header from "../components/header.jsx";
import Footer from "../components/footer.jsx";
import Aside from "../components/aside.jsx";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Card,
  Badge,
  Button,
  ListGroup,
  Stack,
  Image,
} from 'react-bootstrap';

const cardStyle = { minHeight: '160px' };
const priceBadgeStyle = { fontSize: '0.9rem' };
const smallMuted = { fontSize: '0.85rem', color: '#6c757d' };
const imgStyle = { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px' };
const placeholder = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="18">No image</text></svg>';

const Store = () => {
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [balance, setBalance] = useState(null);
  const [userLevel, setUserLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [buying, setBuying] = useState(null);
  const [activating, setActivating] = useState(null);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const response = await api.get('/shop/items/');
      setItems(response.data || []);
    } catch (err) {
      console.error('Ошибка при загрузке товаров:', err);
      setError('Не удалось загрузить товары');
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const response = await api.get('/shop/my-purchases/');
      setPurchases(response.data || []);
      if (response.data && response.data.length > 0) {
        const bal = response.data[0].balance ?? null;
        if (bal !== null) setBalance(bal);
      }
    } catch (err) {
      console.error('Ошибка при загрузке покупок:', err);
      setError('Не удалось загрузить покупки');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile/');
      setUserLevel(response.data.level || 1);
      setBalance(response.data.crystals || 0);
    } catch (err) {
      // Silent error - might be teacher
    }
  };

  useEffect(() => {
    fetchItems();
    fetchPurchases();
    fetchProfile();
  }, []);

  const handleBuy = async (itemId) => {
    setError('');
    setMessage('');
    setBuying(itemId);
    try {
      const response = await api.post(`/shop/buy/${itemId}/`);
      setMessage(response.data.message || 'Покупка успешна');
      if (response.data.balance !== undefined) setBalance(response.data.balance);
      await fetchPurchases();
      await fetchProfile();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ошибка при покупке');
      }
    } finally {
      setBuying(null);
    }
  };

  const handleActivate = async (purchaseId) => {
    setError('');
    setMessage('');
    setActivating(purchaseId);
    try {
      const response = await api.post(`/shop/my-purchases/${purchaseId}/activate/`);
      setMessage(response.data.message || 'Активация успешна');
      await fetchPurchases();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ошибка при активации');
      }
    } finally {
      setActivating(null);
    }
  };

  const renderImage = (url, name) => {
    const safeUrl = url && typeof url === 'string' ? url : placeholder;
    return (
      <Image
        src={safeUrl}
        alt={name || 'item image'}
        style={imgStyle}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
        loading="lazy"
        rounded
      />
    );
  };

  return (
    <div>
      <Header />
      <Aside />
      <Container className="main-content my-4">
        <Row className="mb-3 align-items-center">
          <Col>
            <h2 className="mb-0">Магазин</h2>
            <div style={smallMuted}>Купить предметы и активировать покупки</div>
          </Col>
          <Col xs="auto" className="text-end">
            <div style={{ fontSize: '0.95rem' }}>
              Ваш уровень: <Badge bg="primary" pill style={priceBadgeStyle}>{userLevel}</Badge>
              <span className="mx-2">|</span>
              Баланс: <Badge bg="info" pill style={priceBadgeStyle}>{balance ?? '—'} 💎</Badge>
            </div>
          </Col>
        </Row>

        {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        <Row className="g-3">
          <Col lg={8}>
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>Доступные товары</div>
                <div style={smallMuted}>{loadingItems ? <Spinner animation="border" size="sm" /> : `${items.length} шт.`}</div>
              </Card.Header>
              <Card.Body>
                {loadingItems ? (
                  <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : items.length === 0 ? (
                  <div className="text-center py-4" style={smallMuted}>Нет доступных товаров</div>
                ) : (
                  <Row xs={1} md={2} className="g-3">
                    {items.map((item) => (
                      <Col key={item.id}>
                        <Card style={cardStyle} className="h-100 shadow-sm">
                          {renderImage(item.image_url, item.name)}
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <Card.Title className="mb-1" style={{ fontSize: '1.05rem' }}>{item.name}</Card.Title>
                                <div style={smallMuted}>{item.item_type}</div>
                              </div>
                              <div className="text-end">
                                <Badge bg="secondary" pill style={priceBadgeStyle}>{item.price} 💎</Badge>
                                <div style={smallMuted}>{item.validity_days ? `${item.validity_days} дн.` : 'постоянно'}</div>
                              </div>
                            </div>
                            <div className="flex-grow-1" style={{ marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                              {item.description || <span style={smallMuted}>Описание отсутствует</span>}
                            </div>
                            <div className="mb-2">
                              <Badge bg={item.required_level <= userLevel ? "success" : "warning"} pill>
                                Уровень {item.required_level}
                              </Badge>
                              {item.required_level > userLevel && (
                                <span style={smallMuted} className="ms-2">(нужно {item.required_level} ур.)</span>
                              )}
                            </div>
                            <Stack direction="horizontal" gap={2} className="mt-auto">
                              <Button
                                variant={item.required_level <= userLevel ? "primary" : "secondary"}
                                onClick={() => handleBuy(item.id)}
                                disabled={buying === item.id || item.required_level > userLevel}
                              >
                                {buying === item.id ? <Spinner as="span" animation="border" size="sm" /> : 
                                 item.required_level > userLevel ? 'Недоступно' : 'Купить'}
                              </Button>
                              <Button variant="outline-secondary" onClick={() => navigator.clipboard?.writeText(item.id.toString())}>
                                Копировать ID
                              </Button>
                              <div className="ms-auto" style={smallMuted}>ID: {item.id}</div>
                            </Stack>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>Мои покупки</Card.Header>
              <Card.Body>
                {loadingPurchases ? (
                  <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-4" style={smallMuted}>У вас пока нет покупок</div>
                ) : (
                  <ListGroup variant="flush">
                    {purchases.map((purchase) => (
                      <ListGroup.Item key={purchase.id} className="d-flex align-items-start">
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center mb-1">
                            <strong style={{ marginRight: '8px' }}>{purchase.item?.name || '—'}</strong>
                            <Badge bg={purchase.status === 'active' ? 'success' : purchase.status === 'pending' ? 'warning' : 'secondary'} className="me-2">
                              {purchase.status}
                            </Badge>
                            <div style={smallMuted}>Код: <code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>{purchase.code}</code></div>
                          </div>
                          <div style={smallMuted}>
                            Создана: {new Date(purchase.created_at).toLocaleString()}
                            {purchase.activated_at && <> · Активирована: {new Date(purchase.activated_at).toLocaleString()}</>}
                            {purchase.expires_at && <> · Истекает: {new Date(purchase.expires_at).toLocaleString()}</>}
                          </div>
                        </div>
                        <div className="ms-3 text-end">
                          {purchase.status === 'pending' ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleActivate(purchase.id)}
                              disabled={activating === purchase.id}
                            >
                              {activating === purchase.id ? <Spinner as="span" animation="border" size="sm" /> : 'Активировать'}
                            </Button>
                          ) : (
                            <Button variant="outline-secondary" size="sm" disabled>—</Button>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <Card.Title>Профиль и баланс</Card.Title>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {balance !== null ? `${balance} 💎` : <span style={smallMuted}>—</span>}
                  </div>
                  <div style={smallMuted}>Кристаллы используются для покупок в магазине</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    Уровень {userLevel}
                  </div>
                  <div style={smallMuted}>Ваш текущий уровень открывает доступ к товарам</div>
                </div>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" onClick={fetchPurchases} disabled={loadingPurchases}>
                    {loadingPurchases ? <Spinner as="span" animation="border" size="sm" /> : 'Обновить покупки'}
                  </Button>
                  <Button variant="outline-secondary" onClick={fetchItems} disabled={loadingItems}>
                    {loadingItems ? <Spinner as="span" animation="border" size="sm" /> : 'Обновить товары'}
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Информация</Card.Title>
                <div style={smallMuted}>
                  Товары могут иметь срок действия. После покупки вы получите код и сможете активировать предмет в разделе «Мои покупки».
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Footer />
      </Container>
    </div>
  );
};

export default Store;
