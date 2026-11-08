import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { httpClient } from '@/core/http/http-client';
import i18n from '@/core/i18n/i18n.config';
import {
  AppRoutes,
  projectDetailsPath,
  projectHistoryPath,
} from '@/core/router/app-routes';
import type { Ability } from '@/modules/authorization/domain/ability.schema';
import type { Role } from '@/modules/authorization/domain/role.schema';
import type { UserDetail } from '@/modules/users/domain/user.schema';
import { spiderMan } from '@/test/characters';
import { findDialog } from '@/test/find-dialog';
import {
  csrfResponse,
  requestBody,
  requestKey,
  type StubResponse,
  stubHttpRoutes,
} from '@/test/http-stub';
import { renderRoute } from '@/test/render-route';
import {
  type ProjectDetail,
  type ProjectGoal,
  projectGoalTypeSchema,
  type ProjectHero,
  type ProjectListItem,
  type ProjectStatistics,
} from '../../domain/project.schema';

const adminRole: Role = {
  uuid: '0b7f8f0e-5d2a-4c3e-9f1a-1a2b3c4d5e6f',
  role: 'ADMIN',
  roleLabel: 'Administrador',
  status: 'ACTIVE',
  statusLabel: 'Ativo',
};

const userRole: Role = {
  uuid: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  role: 'USER',
  roleLabel: 'Usuário',
  status: 'ACTIVE',
  statusLabel: 'Ativo',
};

const sessionUser = (roles: Role[]): UserDetail => ({
  uuid: '6f1c2a54-2d0e-4a4b-9a43-2f1f1d7c9b10',
  name: 'Ada Lovelace',
  status: 'ACTIVE',
  statusLabel: 'Ativo',
  roles,
  email: 'ada@example.com',
  emailConfirmedAt: '2026-01-01T00:00:00.000Z',
  creatorName: null,
  updaterName: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  character: null,
});

const peter: ProjectHero = {
  uuid: '9b2d3c4e-1f0a-4b5c-8d7e-6f5a4b3c2d1e',
  name: 'Peter Parker',
  character: spiderMan,
};

const grace: ProjectHero = {
  uuid: '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d',
  name: 'Grace Hopper',
  character: null,
};

// The API labels repeat the raw enum values, as its untranslated fallback does,
// so these tests prove the client translates statuses and goals by itself.
const project: ProjectListItem = {
  uuid: '3d6f0a8e-9b1c-4e2d-8f7a-5c4b3a2d1e0f',
  name: 'Web Shooter',
  status: 'IN_PROGRESS',
  statusLabel: 'IN_PROGRESS',
  progress: 33,
  responsible: peter,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const projectDetail: ProjectDetail = {
  ...project,
  description: 'Build a better web shooter.',
  goals: projectGoalTypeSchema.options.map((goal, index) => ({
    goal,
    goalLabel: goal,
    description: index === 0 ? 'Ship weekly' : null,
    progress: index === 0 ? 100 : index === 1 ? 100 : 0,
  })),
};

const statistics: ProjectStatistics = {
  total: 7,
  pending: 2,
  inProgress: 4,
  completed: 1,
  averageProgress: 42,
};

const goalLabel = (goal: ProjectGoal['goal']) =>
  i18n.t(`projects.goalTypes.${goal}`);

const projectAbilities = (actions: Ability['action'][]): Ability[] =>
  actions.map((action) => ({ action, subject: 'PROJECT' }));

const adminAbilities = projectAbilities(['CREATE', 'READ', 'UPDATE', 'DELETE']);

const envelope = (data: unknown, message?: string): StubResponse => ({
  status: 200,
  data: { data, meta: message ? { message } : {} },
});

const paginated = (data: unknown[]): StubResponse => ({
  status: 200,
  data: { data, meta: { total: data.length, page: 1, limit: 20 } },
});

const renderProjects = (
  path: string,
  {
    roles = [adminRole],
    abilities = adminAbilities,
    routes = {},
  }: {
    roles?: Role[];
    abilities?: Ability[];
    routes?: Record<
      string,
      StubResponse | ((config: InternalAxiosRequestConfig) => StubResponse)
    >;
  } = {},
) => {
  const requests = stubHttpRoutes(httpClient, {
    'GET /auth/csrf': csrfResponse('csrf-token'),
    'GET /users/me': envelope(sessionUser(roles)),
    'GET /users/me/abilities': envelope(abilities),
    'GET /users/me/change-requests': envelope([]),
    'GET /projects': paginated([project]),
    'GET /projects/statistics': envelope(statistics),
    'GET /projects/heroes': paginated([peter, grace]),
    [`GET /projects/${project.uuid}`]: envelope(projectDetail),
    [`GET /projects/${project.uuid}/history`]: paginated([]),
    ...routes,
  });
  const rendered = renderRoute(path);
  const sent = (key: string) =>
    requests.filter((request) => requestKey(request) === key);

  return { ...rendered, sent };
};

const findProjectRow = () =>
  waitFor(() => {
    const row = document.querySelector<HTMLElement>(
      `tr[data-row-key="${project.uuid}"]`,
    );

    if (!row) {
      throw new Error('Row not found');
    }

    return row;
  });

const goalsBodySchema = z.object({
  goals: z.array(
    z.object({
      goal: z.string(),
      description: z.string().nullable(),
      progress: z.number(),
    }),
  ),
});

const createButtonName = () => new RegExp(i18n.t('projects.create.title'));

describe('Default landing and navigation', () => {
  it.each([
    {
      label: 'an administrator',
      roles: [adminRole],
      abilities: adminAbilities,
    },
    {
      label: 'a regular user',
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    },
  ])(
    'opens the projects dashboard for $label with an active session',
    async ({ roles, abilities }) => {
      const { router } = renderProjects(AppRoutes.ROOT, { roles, abilities });

      await findProjectRow();
      expect(router.state.location.pathname).toBe(AppRoutes.PROJECTS);
      expect(
        screen.getByRole('heading', {
          name: i18n.t('projects.dashboard.title'),
        }),
      ).toBeInTheDocument();
    },
  );

  it('sends a signed-in user from a guest page to the projects dashboard', async () => {
    const { router } = renderProjects(AppRoutes.LOGIN, {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    await findProjectRow();
    expect(router.state.location.pathname).toBe(AppRoutes.PROJECTS);
  });

  it('opens Home without READ PROJECT and loads no project data', async () => {
    const { router, sent } = renderProjects(AppRoutes.ROOT, { abilities: [] });

    expect(
      await screen.findByText(
        i18n.t('home.greeting', { name: 'Ada Lovelace' }),
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AppRoutes.HOME);
    expect(sent('GET /projects')).toHaveLength(0);
    expect(sent('GET /projects/statistics')).toHaveLength(0);
  });

  it('shows the forbidden page at the dashboard without READ PROJECT', async () => {
    const { router, sent } = renderProjects(AppRoutes.PROJECTS, {
      abilities: [],
    });

    expect(
      await screen.findByText(i18n.t('forbidden.title')),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(AppRoutes.PROJECTS);
    expect(sent('GET /projects')).toHaveLength(0);
  });

  it('keeps Home under General and the dashboard under Projects', async () => {
    renderProjects(AppRoutes.PROJECTS);

    const navigation = await screen.findByRole('navigation', {
      name: i18n.t('layout.navigation'),
    });
    expect(
      await within(navigation).findByRole('menuitem', {
        name: i18n.t('navigationSections.projects'),
      }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      await within(navigation).findByRole('link', {
        name: i18n.t('navigation.projectsDashboard'),
      }),
    ).toHaveAttribute('href', AppRoutes.PROJECTS);

    fireEvent.click(
      within(navigation).getByRole('menuitem', {
        name: i18n.t('navigationSections.general'),
      }),
    );
    expect(
      await within(navigation).findByRole('link', {
        name: i18n.t('navigation.home'),
      }),
    ).toHaveAttribute('href', AppRoutes.HOME);
  });

  it('keeps the original Home page with a dashboard shortcut', async () => {
    renderProjects(AppRoutes.HOME, {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    expect(
      await within(await screen.findByRole('main')).findByRole('link', {
        name: new RegExp(i18n.t('projects.dashboard.title')),
      }),
    ).toHaveAttribute('href', AppRoutes.PROJECTS);
    expect(screen.getByText(i18n.t('home.description'))).toBeInTheDocument();
  });
});

describe('Projects dashboard', () => {
  it('shows the indicators and the project list with the hero display name', async () => {
    renderProjects(AppRoutes.PROJECTS);

    const row = await findProjectRow();
    expect(
      within(row).getByRole('link', { name: project.name }),
    ).toHaveAttribute('href', projectDetailsPath(project.uuid));
    expect(row).toHaveTextContent('Peter Parker (Spider-Man)');
    expect(row).toHaveTextContent(i18n.t('projects.status.IN_PROGRESS'));
    expect(
      within(row).getByRole('progressbar', {
        name: i18n.t('projects.progressOf', { name: project.name }),
      }),
    ).toBeInTheDocument();

    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(main).toHaveTextContent(
        i18n.t('projects.statistics.averageProgress'),
      );
    });
    for (const value of ['7', '2', '4', '1', '42']) {
      expect(within(main).getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  it.each([
    {
      label: 'an administrator',
      roles: [adminRole],
      abilities: adminAbilities,
    },
    {
      label: 'a regular user',
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    },
  ])(
    'lets $label open the project details from the actions column',
    async ({ roles, abilities }) => {
      const { router } = renderProjects(AppRoutes.PROJECTS, {
        roles,
        abilities,
      });

      const viewDetails = within(await findProjectRow()).getByRole('link', {
        name: i18n.t('projects.actions.details', { name: project.name }),
      });
      expect(viewDetails).toHaveAttribute(
        'href',
        projectDetailsPath(project.uuid),
      );

      fireEvent.mouseEnter(viewDetails);
      expect(
        await screen.findByRole('tooltip', {
          name: i18n.t('projects.actions.viewDetails'),
        }),
      ).toBeInTheDocument();

      fireEvent.click(viewDetails);
      await waitFor(() => {
        expect(router.state.location.pathname).toBe(
          projectDetailsPath(project.uuid),
        );
      });
      expect(
        await screen.findByRole('heading', { name: project.name }),
      ).toBeInTheDocument();
    },
  );

  it('gives a regular user a read-only list without the hero filter', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS, {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    const row = await findProjectRow();
    expect(
      screen.queryByRole('button', { name: createButtonName() }),
    ).not.toBeInTheDocument();
    expect(
      within(row).queryByRole('button', {
        name: i18n.t('projects.actions.edit', { name: project.name }),
      }),
    ).not.toBeInTheDocument();
    expect(
      within(row).queryByRole('button', {
        name: i18n.t('projects.actions.delete', { name: project.name }),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: i18n.t('projects.fields.responsible'),
      }),
    ).not.toBeInTheDocument();
    expect(sent('GET /projects/heroes')).toHaveLength(0);
  });

  it('keeps a regular user read-only even when granted project write abilities', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS, { roles: [userRole] });

    const row = await findProjectRow();
    expect(
      within(row).getByRole('link', {
        name: i18n.t('projects.actions.details', { name: project.name }),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: createButtonName() }),
    ).not.toBeInTheDocument();
    expect(
      within(row).queryByRole('button', {
        name: i18n.t('projects.actions.edit', { name: project.name }),
      }),
    ).not.toBeInTheDocument();
    expect(
      within(row).queryByRole('button', {
        name: i18n.t('projects.actions.delete', { name: project.name }),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: i18n.t('projects.fields.responsible'),
      }),
    ).not.toBeInTheDocument();
    expect(sent('GET /projects/heroes')).toHaveLength(0);
  });

  it('lets an administrator filter by responsible hero', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS);

    await findProjectRow();
    const heroFilter = await screen.findByRole('combobox', {
      name: i18n.t('projects.fields.responsible'),
    });
    fireEvent.mouseDown(heroFilter);
    fireEvent.click(await screen.findByTitle('Grace Hopper'));

    await waitFor(() => {
      expect(sent('GET /projects').at(-1)?.params).toMatchObject({
        responsible: grace.uuid,
      });
    });
  });

  it('tells a regular user when no project is assigned to them', async () => {
    renderProjects(AppRoutes.PROJECTS, {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
      routes: { 'GET /projects': paginated([]) },
    });

    expect(
      await screen.findByText(i18n.t('projects.empty.assigned')),
    ).toBeInTheDocument();
  });

  it('explains an empty list caused by the filters', async () => {
    renderProjects(`${AppRoutes.PROJECTS}?status=COMPLETED`, {
      routes: { 'GET /projects': paginated([]) },
    });

    expect(
      await screen.findByText(i18n.t('projects.empty.filtered')),
    ).toBeInTheDocument();
  });

  it('filters by status on the server', async () => {
    const { sent } = renderProjects(`${AppRoutes.PROJECTS}?status=COMPLETED`);

    await findProjectRow();
    expect(sent('GET /projects').at(-1)?.params).toEqual({
      page: 1,
      limit: 20,
      status: 'COMPLETED',
    });
  });

  it('creates a project assigned to a searched hero', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS, {
      routes: {
        'POST /projects': envelope(projectDetail, 'Projeto criado'),
      },
    });

    await findProjectRow();
    fireEvent.click(screen.getByRole('button', { name: createButtonName() }));
    const dialog = await findDialog(i18n.t('projects.create.title'));
    fireEvent.change(
      within(dialog).getByLabelText(i18n.t('projects.fields.name')),
      { target: { value: 'Spider Tracer' } },
    );
    fireEvent.change(
      within(dialog).getByLabelText(i18n.t('projects.fields.description')),
      { target: { value: 'Track villains.' } },
    );
    const heroSelect = within(dialog).getByLabelText(
      i18n.t('projects.fields.responsible'),
    );
    fireEvent.mouseDown(heroSelect);
    fireEvent.change(heroSelect, { target: { value: 'grace' } });
    await waitFor(() => {
      expect(sent('GET /projects/heroes').at(-1)?.params).toMatchObject({
        name: 'grace',
      });
    });
    fireEvent.click(await screen.findByTitle('Grace Hopper'));
    fireEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('common.save') }),
    );

    expect(await screen.findByText('Projeto criado')).toBeInTheDocument();
    expect(requestBody(sent('POST /projects')[0])).toEqual({
      name: 'Spider Tracer',
      description: 'Track villains.',
      responsibleUuid: grace.uuid,
    });
    await waitFor(() => {
      expect(sent('GET /projects/statistics')).toHaveLength(2);
    });
  });

  it('reassigns the hero by sending only the changed fields', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS, {
      routes: {
        [`PATCH /projects/${project.uuid}`]: envelope(
          projectDetail,
          'Projeto atualizado',
        ),
      },
    });

    fireEvent.click(
      within(await findProjectRow()).getByRole('button', {
        name: i18n.t('projects.actions.edit', { name: project.name }),
      }),
    );
    const dialog = await findDialog(i18n.t('projects.edit.title'));
    expect(
      within(dialog).getByLabelText(i18n.t('projects.fields.name')),
    ).toHaveValue(project.name);
    fireEvent.mouseDown(
      within(dialog).getByLabelText(i18n.t('projects.fields.responsible')),
    );
    fireEvent.click(await screen.findByTitle('Grace Hopper'));
    fireEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('common.save') }),
    );

    expect(await screen.findByText('Projeto atualizado')).toBeInTheDocument();
    expect(requestBody(sent(`PATCH /projects/${project.uuid}`)[0])).toEqual({
      responsibleUuid: grace.uuid,
    });
  });

  it('deletes a project after confirmation', async () => {
    const { sent } = renderProjects(AppRoutes.PROJECTS, {
      routes: {
        [`DELETE /projects/${project.uuid}`]: envelope(
          null,
          'Projeto excluído',
        ),
      },
    });

    fireEvent.click(
      within(await findProjectRow()).getByRole('button', {
        name: i18n.t('projects.actions.delete', { name: project.name }),
      }),
    );
    expect(sent(`DELETE /projects/${project.uuid}`)).toHaveLength(0);
    fireEvent.click(
      await screen.findByRole('button', { name: i18n.t('common.delete') }),
    );

    expect(await screen.findByText('Projeto excluído')).toBeInTheDocument();
    expect(sent(`DELETE /projects/${project.uuid}`)).toHaveLength(1);
  });
});

describe('Project history page', () => {
  afterEach(async () => {
    await i18n.changeLanguage('pt-BR');
  });

  it.each(['pt-BR', 'en'])(
    'opens history from details and returns to the project in %s',
    async (language) => {
      await i18n.changeLanguage(language);
      const { router, sent } = renderProjects(
        projectDetailsPath(project.uuid),
        {
          roles: [userRole],
          abilities: projectAbilities(['READ']),
        },
      );
      const historyLink = await screen.findByRole('link', {
        name: i18n.t('projects.history.view'),
      });
      expect(historyLink).toHaveAttribute(
        'href',
        projectHistoryPath(project.uuid),
      );
      expect(sent(`GET /projects/${project.uuid}/history`)).toHaveLength(0);
      fireEvent.click(historyLink);

      expect(
        await screen.findByRole('heading', {
          name: i18n.t('projects.history.pageTitle', { name: project.name }),
        }),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(i18n.t('projects.history.empty')),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        projectHistoryPath(project.uuid),
      );
      fireEvent.click(
        screen.getByRole('link', { name: i18n.t('projects.history.back') }),
      );

      expect(
        await screen.findByRole('heading', { name: project.name }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(
        projectDetailsPath(project.uuid),
      );
      expect(
        screen.queryByText(i18n.t('projects.history.empty')),
      ).not.toBeInTheDocument();
    },
  );

  it.each([adminRole, userRole])(
    'allows direct history navigation for $role with project read access',
    async (role) => {
      renderProjects(projectHistoryPath(project.uuid), {
        roles: [role],
        abilities: projectAbilities(['READ']),
      });

      expect(
        await screen.findByRole('heading', {
          name: i18n.t('projects.history.pageTitle', { name: project.name }),
        }),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(i18n.t('projects.history.empty')),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: i18n.t('projects.actions.editProject'),
        }),
      ).not.toBeInTheDocument();
    },
  );

  it('requires project read access before fetching project or history data', async () => {
    const { sent } = renderProjects(projectHistoryPath(project.uuid), {
      abilities: [],
    });

    expect(
      await screen.findByText(i18n.t('forbidden.title')),
    ).toBeInTheDocument();
    expect(sent(`GET /projects/${project.uuid}`)).toHaveLength(0);
    expect(sent(`GET /projects/${project.uuid}/history`)).toHaveLength(0);
  });

  it('shows the project error without loading history for an inaccessible project', async () => {
    const { sent } = renderProjects(projectHistoryPath(project.uuid), {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
      routes: {
        [`GET /projects/${project.uuid}`]: {
          status: 404,
          data: { message: 'Projeto não encontrado' },
        },
      },
    });

    expect(
      await screen.findByText('Projeto não encontrado'),
    ).toBeInTheDocument();
    expect(sent(`GET /projects/${project.uuid}/history`)).toHaveLength(0);
    expect(
      screen.queryByText(i18n.t('projects.history.empty')),
    ).not.toBeInTheDocument();
  });
});

describe('Project details', () => {
  afterEach(async () => {
    await i18n.changeLanguage('pt-BR');
  });

  it('shows the description, hero, overall progress, every goal, and a history link', async () => {
    const { sent } = renderProjects(projectDetailsPath(project.uuid), {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    expect(
      await screen.findByRole('heading', { name: project.name }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(projectDetail.description);
    expect(main).toHaveTextContent('Peter Parker (Spider-Man)');
    expect(main).toHaveTextContent('Ship weekly');
    expect(
      within(main).getByRole('link', { name: i18n.t('projects.history.view') }),
    ).toHaveAttribute('href', projectHistoryPath(project.uuid));
    expect(
      screen.queryByText(i18n.t('projects.history.empty')),
    ).not.toBeInTheDocument();
    expect(sent(`GET /projects/${project.uuid}/history`)).toHaveLength(0);
    for (const goal of projectGoalTypeSchema.options) {
      expect(
        within(main).getByRole('progressbar', {
          name: i18n.t('projects.goals.progressOf', { goal: goalLabel(goal) }),
        }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('button', {
        name: new RegExp(i18n.t('projects.actions.editGoals')),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: new RegExp(i18n.t('common.delete')),
      }),
    ).not.toBeInTheDocument();
  });

  it('hides project management from a regular user granted write abilities', async () => {
    renderProjects(projectDetailsPath(project.uuid), { roles: [userRole] });

    await screen.findByRole('heading', { name: project.name });
    for (const name of [
      i18n.t('projects.actions.editProject'),
      i18n.t('projects.actions.editGoals'),
      i18n.t('common.delete'),
    ]) {
      expect(
        screen.queryByRole('button', { name: new RegExp(name) }),
      ).not.toBeInTheDocument();
    }
  });

  it('translates the status and goals when the language changes', async () => {
    await act(() => i18n.changeLanguage('pt-BR'));
    renderProjects(projectDetailsPath(project.uuid), {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    await screen.findByRole('heading', { name: project.name });
    const main = screen.getByRole('main');
    const expectLabels = (status: string, goals: string[]) => {
      expect(main).toHaveTextContent(status);
      for (const goal of goals) {
        expect(main).toHaveTextContent(goal);
      }
    };

    expectLabels('Em andamento', [
      'Agilidade',
      'Encantamento',
      'Eficiência',
      'Excelência',
      'Transparência',
      'Ambição',
    ]);
    expect(main).not.toHaveTextContent(project.status);
    for (const goal of projectGoalTypeSchema.options) {
      expect(main).not.toHaveTextContent(goal);
    }

    await act(() => i18n.changeLanguage('en'));

    expectLabels('In progress', [
      'Agility',
      'Delight',
      'Efficiency',
      'Excellence',
      'Transparency',
      'Ambition',
    ]);
  });

  it('shows the API error for a project outside the hero scope', async () => {
    const { sent } = renderProjects(projectDetailsPath(project.uuid), {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
      routes: {
        [`GET /projects/${project.uuid}`]: {
          status: 404,
          data: { message: 'Projeto não encontrado' },
        },
      },
    });

    expect(
      await screen.findByText('Projeto não encontrado'),
    ).toBeInTheDocument();
    expect(sent(`GET /projects/${project.uuid}/history`)).toHaveLength(0);
  });

  it('keeps the dashboard entry selected in the sidebar', async () => {
    renderProjects(projectDetailsPath(project.uuid), {
      roles: [userRole],
      abilities: projectAbilities(['READ']),
    });

    await screen.findByRole('heading', { name: project.name });
    const navigation = screen.getByRole('navigation', {
      name: i18n.t('layout.navigation'),
    });
    const entry = within(navigation)
      .getByRole('link', { name: i18n.t('navigation.projectsDashboard') })
      .closest('li');
    expect(entry).toHaveClass('ant-menu-item-selected');
  });

  it('offers goal editing next to the goals and refreshes the project', async () => {
    const { sent } = renderProjects(projectDetailsPath(project.uuid), {
      routes: {
        [`PATCH /projects/${project.uuid}/goals`]: envelope(
          projectDetail,
          'Metas atualizadas',
        ),
      },
    });

    const goalsCard = (
      await screen.findByText(i18n.t('projects.goals.title'))
    ).closest<HTMLElement>('.ant-card');
    if (!goalsCard) {
      throw new Error('Goals card not found');
    }
    fireEvent.click(
      within(goalsCard).getByRole('button', {
        name: new RegExp(i18n.t('projects.actions.editGoals')),
      }),
    );
    const dialog = await findDialog(
      i18n.t('projects.goals.editTitle', { name: project.name }),
    );
    const detailRequests = sent(`GET /projects/${project.uuid}`).length;
    fireEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('common.save') }),
    );

    expect(await screen.findByText('Metas atualizadas')).toBeInTheDocument();
    await waitFor(() => {
      expect(sent(`GET /projects/${project.uuid}`).length).toBeGreaterThan(
        detailRequests,
      );
    });
  });

  it('lets an administrator update the goals', async () => {
    const { sent } = renderProjects(projectDetailsPath(project.uuid), {
      routes: {
        [`PATCH /projects/${project.uuid}/goals`]: envelope(
          projectDetail,
          'Metas atualizadas',
        ),
      },
    });

    fireEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(i18n.t('projects.actions.editGoals')),
      }),
    );
    const dialog = await findDialog(
      i18n.t('projects.goals.editTitle', { name: project.name }),
    );
    const ambition = within(dialog).getByLabelText(
      i18n.t('projects.goals.progressValueOf', { goal: goalLabel('AMBITION') }),
    );
    fireEvent.change(ambition, { target: { value: '55' } });
    fireEvent.blur(ambition);
    const [agilityDescription] = within(dialog).getAllByLabelText(
      i18n.t('projects.goals.description'),
    );
    fireEvent.change(agilityDescription, { target: { value: '  ' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('common.save') }),
    );

    expect(await screen.findByText('Metas atualizadas')).toBeInTheDocument();
    const { goals } = goalsBodySchema.parse(
      requestBody(sent(`PATCH /projects/${project.uuid}/goals`)[0]),
    );
    expect(goals).toHaveLength(6);
    expect(goals[0]).toEqual({
      goal: 'AGILITY',
      description: null,
      progress: 100,
    });
    expect(goals.at(-1)).toEqual({
      goal: 'AMBITION',
      description: null,
      progress: 55,
    });
  });

  it('returns to the dashboard after deleting the project', async () => {
    const { router } = renderProjects(projectDetailsPath(project.uuid), {
      routes: {
        [`DELETE /projects/${project.uuid}`]: envelope(
          null,
          'Projeto excluído',
        ),
      },
    });

    fireEvent.click(
      await screen.findByRole('button', {
        name: new RegExp(i18n.t('common.delete')),
      }),
    );
    const confirmations = await screen.findAllByRole('button', {
      name: i18n.t('common.delete'),
    });
    fireEvent.click(confirmations[confirmations.length - 1]);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(AppRoutes.PROJECTS);
    });
  });
});
