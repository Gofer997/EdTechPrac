import { useState, useEffect } from 'react';
import api from '../api.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Row,
  Col,
  Card,
  Badge,
  ProgressBar,
  Spinner,
  Alert,
} from 'react-bootstrap';

const DailyQuests = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const questTypeLabels = {
    'login': 'Вход в систему',
    'attend_lesson': 'Посетить урок',
    'submit_assignment': 'Сдать задание',
    'buy_item': 'Купить товар',
    'earn_xp': 'Заработать XP',
  };

  useEffect(() => {
    const fetchQuests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('daily-quests/');
        setQuests(response.data || []);
      } catch (err) {
        setError('Не удалось загрузить ежедневные задания');
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  const getProgressPercentage = (progress, target) => {
    return Math.min((progress / target) * 100, 100);
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h5 className="mb-0">Ежедневные задания</h5>
          <p className="text-muted small mb-0">Выполняйте задания каждый день для получения наград</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </div>
      ) : quests.length === 0 ? (
        <Card className="mb-3">
          <Card.Body className="text-center py-3">
            <p className="text-muted small mb-0">Нет доступных заданий</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="mb-3">
          {quests.map((quest) => (
            <Col key={quest.id} md={6} lg={4} className="mb-3">
              <Card className={`h-100 ${quest.completed ? 'border-success' : ''}`}>
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0 fs-6">
                      {questTypeLabels[quest.quest_type] || quest.quest_type}
                    </Card.Title>
                    <Badge bg={quest.completed ? 'success' : 'primary'} pill className="fs-6">
                      {quest.completed ? 'Выполнено' : 'В процессе'}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Прогресс</small>
                      <small className="text-muted">
                        {quest.progress} / {quest.target_value}
                      </small>
                    </div>
                    <ProgressBar
                      now={getProgressPercentage(quest.progress, quest.target_value)}
                      variant={quest.completed ? 'success' : 'primary'}
                      style={{ height: '6px' }}
                    />
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    {quest.xp_reward > 0 && (
                      <Badge bg="warning" text = "dark" className="fs-6">
                        +{quest.xp_reward} XP
                      </Badge>
                    )}
                    {quest.crystal_reward > 0 && (
                      <Badge bg="info" className="fs-6">
                        +{quest.crystal_reward} 💎
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default DailyQuests;
