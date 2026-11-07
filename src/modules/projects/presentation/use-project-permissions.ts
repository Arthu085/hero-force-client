import { useSession } from '@/modules/auth/infra/auth.queries';
import { hasAbility } from '@/modules/authorization/domain/ability.schema';
import { hasAdminRole } from '@/modules/authorization/domain/role.schema';
import { useAbilities } from '@/modules/authorization/infra/abilities.queries';

type ProjectManagementAction = 'CREATE' | 'UPDATE' | 'DELETE';

export const useProjectPermissions = () => {
  const { data: user } = useSession();
  const { data: abilities = [] } = useAbilities();
  const isAdmin = user ? hasAdminRole(user.roles) : false;

  const canManage = (action: ProjectManagementAction) =>
    isAdmin && hasAbility(abilities, { action, subject: 'PROJECT' });

  return { isAdmin, canManage };
};
