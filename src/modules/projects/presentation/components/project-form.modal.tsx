import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFeedbackModal } from '@/shared/feedback/use-feedback-modal';
import { FormModal } from '@/shared/forms/form-modal';
import { zodRule } from '@/shared/forms/zod-rule';
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  type ProjectForm,
  projectFormSchema,
} from '../../domain/project-form.schemas';
import type { ProjectDetail } from '../../domain/project.schema';
import {
  useCreateProject,
  useUpdateProject,
} from '../../infra/projects.queries';
import { HeroSelect } from './hero-select';

interface ProjectFormModalProps {
  open: boolean;
  project?: ProjectDetail | null;
  onClose: () => void;
}

const changedFields = (
  values: ProjectForm,
  project: ProjectDetail,
): Partial<ProjectForm> => ({
  ...(values.name !== project.name && { name: values.name }),
  ...(values.description !== project.description && {
    description: values.description,
  }),
  ...(values.responsibleUuid !== project.responsible.uuid && {
    responsibleUuid: values.responsibleUuid,
  }),
});

export const ProjectFormModal = ({
  open,
  project,
  onClose,
}: ProjectFormModalProps) => {
  const { t } = useTranslation();
  const { showError } = useFeedbackModal();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const { shape } = projectFormSchema;

  const handleSubmit = (values: ProjectForm) => {
    const parsed = projectFormSchema.parse(values);
    const callbacks = { onSuccess: onClose, onError: showError };

    if (project) {
      updateMutation.mutate(
        { uuid: project.uuid, ...changedFields(parsed, project) },
        callbacks,
      );
    } else {
      createMutation.mutate(parsed, callbacks);
    }
  };

  return (
    <FormModal<ProjectForm>
      open={open}
      title={t(project ? 'projects.edit.title' : 'projects.create.title')}
      initialValues={
        project
          ? {
              name: project.name,
              description: project.description,
              responsibleUuid: project.responsible.uuid,
            }
          : undefined
      }
      submitting={createMutation.isPending || updateMutation.isPending}
      onSubmit={handleSubmit}
      onCancel={onClose}
    >
      <Form.Item
        name="name"
        label={t('projects.fields.name')}
        rules={[zodRule(shape.name)]}
      >
        <Input autoComplete="off" maxLength={PROJECT_NAME_MAX_LENGTH} />
      </Form.Item>
      <Form.Item
        name="description"
        label={t('projects.fields.description')}
        rules={[zodRule(shape.description)]}
      >
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 8 }}
          maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
          showCount
        />
      </Form.Item>
      <Form.Item
        name="responsibleUuid"
        label={t('projects.fields.responsible')}
        rules={[zodRule(shape.responsibleUuid)]}
      >
        <HeroSelect knownHeroes={project ? [project.responsible] : []} />
      </Form.Item>
    </FormModal>
  );
};
