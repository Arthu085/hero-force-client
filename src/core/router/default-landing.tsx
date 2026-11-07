import { Navigate } from 'react-router';
import { hasAbility } from '@/modules/authorization/domain/ability.schema';
import { useAbilities } from '@/modules/authorization/infra/abilities.queries';
import { PageLoader } from '@/shared/components/page-loader';
import { AppRoutes } from './app-routes';
import { projectsPage } from './page-metadata';

export const DefaultLanding = () => {
  const { data: abilities = [], isPending } = useAbilities();

  if (isPending) {
    return <PageLoader />;
  }

  return (
    <Navigate
      to={
        hasAbility(abilities, projectsPage.ability)
          ? AppRoutes.PROJECTS
          : AppRoutes.HOME
      }
      replace
    />
  );
};
