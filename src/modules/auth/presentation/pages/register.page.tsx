import { Button, Flex, Form, Input, Result, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AppRoutes } from '@/core/router/app-routes';
import { CharacterSelect } from '@/modules/characters/presentation/components/character-select';
import {
  confirmNewPasswordSchema,
  type RegisterForm,
  registerFormSchema,
} from '@/modules/users/domain/user-form.schemas';
import { useFeedbackModal } from '@/shared/feedback/use-feedback-modal';
import { zodRule } from '@/shared/forms/zod-rule';
import { useRegister } from '../../infra/auth.queries';

type RegisterFormValues = RegisterForm & { confirmPassword: string };

export const RegisterPage = () => {
  const { t } = useTranslation();
  const registerMutation = useRegister();
  const { showError } = useFeedbackModal();
  const { shape } = registerFormSchema;
  const backToLogin = <Link to={AppRoutes.LOGIN}>{t('auth.backToLogin')}</Link>;

  if (registerMutation.isSuccess) {
    return (
      <Result
        status="success"
        title={t('auth.register.successTitle')}
        subTitle={t('auth.register.successSubtitle')}
        extra={backToLogin}
      />
    );
  }

  const handleFinish = (values: RegisterFormValues) => {
    registerMutation.mutate(registerFormSchema.parse(values), {
      onError: showError,
    });
  };

  return (
    <Flex vertical gap="middle">
      <Typography.Title level={3}>{t('auth.register.title')}</Typography.Title>
      <Typography.Text type="secondary">
        {t('auth.register.subtitle')}
      </Typography.Text>
      <Form<RegisterFormValues>
        layout="vertical"
        requiredMark={false}
        initialValues={{ characterCode: null }}
        disabled={registerMutation.isPending}
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label={t('users.fields.name')}
          rules={[zodRule(shape.name)]}
        >
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label={t('auth.fields.email')}
          rules={[zodRule(shape.email)]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('auth.fields.password')}
          rules={[zodRule(shape.password)]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('auth.register.confirmPassword')}
          dependencies={['password']}
          rules={[
            ({ getFieldValue }) =>
              zodRule(confirmNewPasswordSchema(getFieldValue('password'))),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="characterCode"
          label={t('users.fields.character')}
          extra={t('auth.register.characterHelp')}
          rules={[zodRule(shape.characterCode)]}
        >
          <CharacterSelect />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={registerMutation.isPending}
        >
          {t('auth.register.submit')}
        </Button>
      </Form>
      {backToLogin}
    </Flex>
  );
};
