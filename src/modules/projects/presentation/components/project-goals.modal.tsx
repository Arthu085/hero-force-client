import { Col, Form, Input, InputNumber, Row, Slider } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFeedbackModal } from '@/shared/feedback/use-feedback-modal';
import { FormModal } from '@/shared/forms/form-modal';
import { zodRule } from '@/shared/forms/zod-rule';
import {
  PROJECT_GOAL_DESCRIPTION_MAX_LENGTH,
  projectGoalDescriptionSchema,
  projectGoalProgressSchema,
  type ProjectGoalsForm,
  projectGoalsFormSchema,
} from '../../domain/project-form.schemas';
import {
  PROJECT_PROGRESS_MAX,
  PROJECT_PROGRESS_MIN,
  type ProjectDetail,
} from '../../domain/project.schema';
import { useUpdateProjectGoals } from '../../infra/projects.queries';

interface ProjectGoalsModalProps {
  project: ProjectDetail | null;
  onClose: () => void;
}

export const ProjectGoalsModal = ({
  project,
  onClose,
}: ProjectGoalsModalProps) => {
  const { t } = useTranslation();
  const { showError } = useFeedbackModal();
  const updateMutation = useUpdateProjectGoals();

  return (
    <FormModal<ProjectGoalsForm>
      open={project !== null}
      title={t('projects.goals.editTitle', { name: project?.name ?? '' })}
      width={720}
      initialValues={{
        goals: project?.goals.map(({ goal, description, progress }) => ({
          goal,
          description,
          progress,
        })),
      }}
      submitting={updateMutation.isPending}
      onSubmit={(values) => {
        if (!project) {
          return;
        }
        updateMutation.mutate(
          {
            uuid: project.uuid,
            ...projectGoalsFormSchema.parse(values),
          },
          { onSuccess: onClose, onError: showError },
        );
      }}
      onCancel={onClose}
    >
      {project?.goals.map(({ goal, goalLabel }, index) => (
        <fieldset
          key={goal}
          style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
        >
          <legend style={{ fontWeight: 600, marginBottom: 8 }}>
            {goalLabel}
          </legend>
          <Form.Item name={['goals', index, 'goal']} hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name={['goals', index, 'description']}
                label={t('projects.goals.description')}
                rules={[zodRule(projectGoalDescriptionSchema)]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  maxLength={PROJECT_GOAL_DESCRIPTION_MAX_LENGTH}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label={t('projects.goals.progress')} required={false}>
                <Row gutter={8} align="middle" wrap={false}>
                  <Col flex="auto">
                    <Form.Item name={['goals', index, 'progress']} noStyle>
                      <Slider
                        min={PROJECT_PROGRESS_MIN}
                        max={PROJECT_PROGRESS_MAX}
                        aria-label={t('projects.goals.progressOf', {
                          goal: goalLabel,
                        })}
                      />
                    </Form.Item>
                  </Col>
                  <Col flex="none">
                    <Form.Item
                      name={['goals', index, 'progress']}
                      noStyle
                      rules={[zodRule(projectGoalProgressSchema)]}
                    >
                      <InputNumber
                        min={PROJECT_PROGRESS_MIN}
                        max={PROJECT_PROGRESS_MAX}
                        precision={0}
                        suffix="%"
                        aria-label={t('projects.goals.progressValueOf', {
                          goal: goalLabel,
                        })}
                        style={{ width: 96 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </fieldset>
      ))}
    </FormModal>
  );
};
