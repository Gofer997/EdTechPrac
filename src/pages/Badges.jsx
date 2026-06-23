import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import Header from '../components/header.jsx';
import Footer from '../components/footer.jsx';
import Aside from '../components/aside.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from 'react-bootstrap';

const Badges = () => {
  const navigate = useNavigate();
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [levelRewards, setLevelRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access')) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [badgesRes, myBadgesRes, rewardsRes] = await Promise.all([
          api.get('badges/'),
          api.get('my-badges/'),
          api.get('level-rewards/'),
        ]);
        setAllBadges(badgesRes.data || []);
        setMyBadges(myBadgesRes.data || []);
        setLevelRewards(rewardsRes.data || []);
      } catch (err) {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div>
      <Header />
      <Aside />
      <Container className="main-content my-4">
        <Row className="mb-4">
          <Col>
            <h2 className="mb-0">Достижения и награды</h2>
            <p className="text-muted">Отслеживайте свои достижения и получайте награды за уровни</p>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Tabs defaultActiveKey="badges" className="mb-4">
            <Tab eventKey="badges" title="Мои значки">
              <Row>
                {myBadges.length === 0 ? (
                  <Col>
                    <Card className="text-center py-5">
                      <Card.Body>
                        <p className="text-muted">У вас пока нет значков</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  myBadges.map((badge) => (
                    <Col key={badge.id} md={6} lg={4} className="mb-4">
                      <Card className="h-100 border-success">
                        <Card.Body>
                          <Card.Title className="mb-2">{badge.badge_name}</Card.Title>
                          <p className="text-muted mb-3">{badge.description}</p>
                          <div className="d-flex gap-2 flex-wrap">
                            <Badge bg="success" pill>Получено</Badge>
                            <small className="text-muted">
                              {new Date(badge.obtained_at).toLocaleDateString()}
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Tab>

            <Tab eventKey="all-badges" title="Все значки">
              <Row>
                {allBadges.length === 0 ? (
                  <Col>
                    <Card className="text-center py-5">
                      <Card.Body>
                        <p className="text-muted">Нет доступных значков</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  allBadges.map((badge) => (
                    <Col key={badge.id} md={6} lg={4} className="mb-4">
                      <Card className={`h-100 ${badge.obtained ? 'border-success' : ''}`}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0">{badge.name}</Card.Title>
                            <Badge bg={badge.obtained ? 'success' : 'secondary'} pill>
                              {badge.obtained ? 'Получено' : 'Не получено'}
                            </Badge>
                          </div>
                          <p className="text-muted mb-3">{badge.description}</p>
                          <div className="d-flex gap-2 flex-wrap">
                            {badge.xp_reward > 0 && (
                              <Badge bg="warning" text="dark">
                                +{badge.xp_reward} XP
                              </Badge>
                            )}
                            {badge.crystal_reward > 0 && (
                              <Badge bg="info">
                                +{badge.crystal_reward} 💎
                              </Badge>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Tab>

            <Tab eventKey="level-rewards" title="Награды за уровни">
              <Row>
                {levelRewards.length === 0 ? (
                  <Col>
                    <Card className="text-center py-5">
                      <Card.Body>
                        <p className="text-muted">Нет доступных наград</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ) : (
                  levelRewards.map((reward) => (
                    <Col key={reward.level} md={6} lg={4} className="mb-4">
                      <Card className={`h-100 ${reward.obtained ? 'border-success' : ''}`}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0">Уровень {reward.level}</Card.Title>
                            <Badge bg={reward.obtained ? 'success' : 'secondary'} pill>
                              {reward.obtained ? 'Получено' : 'Не получено'}
                            </Badge>
                          </div>
                          <div className="mb-3">
                            {reward.crystals_bonus > 0 && (
                              <div className="mb-1">
                                <Badge bg="info">+{reward.crystals_bonus} 💎</Badge>
                              </div>
                            )}
                            {reward.badge && (
                              <div>
                                <Badge bg="warning" text="dark">{reward.badge}</Badge>
                              </div>
                            )}
                          </div>
                          <p className="text-muted mb-0">
                            {reward.obtained ? 'Награда получена' : 'Достигните этого уровня для получения награды'}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Tab>
          </Tabs>
        )}

        <Card className="mt-4 bg-light">
          <Card.Body>
            <h5 className="mb-3">Информация</h5>
            <p className="text-muted mb-0">
              Значки выдаются за выполнение определённых условий (посещение уроков, сдача заданий, накопление XP).
              Награды за уровни автоматически выдаются при повышении уровня. Проверяйте этот раздел регулярно!
            </p>
          </Card.Body>
        </Card>

        <Footer />
      </Container>
    </div>
  );
};

export default Badges;
