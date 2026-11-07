import { describe, expect, it } from 'vitest';
import {
  PROJECT_NAME_MAX_LENGTH,
  projectFormSchema,
  projectGoalsFormSchema,
} from '../project-form.schemas';

const validProject = {
  name: 'Web Shooter',
  description: 'Build a better web shooter.',
  responsibleUuid: '9b2d3c4e-1f0a-4b5c-8d7e-6f5a4b3c2d1e',
};

describe('projectFormSchema', () => {
  it('accepts a complete project', () => {
    expect(projectFormSchema.parse(validProject)).toEqual(validProject);
  });

  it.each([
    { field: 'name', value: '   ' },
    { field: 'description', value: '' },
    { field: 'name', value: 'x'.repeat(PROJECT_NAME_MAX_LENGTH + 1) },
    { field: 'responsibleUuid', value: undefined },
  ])('rejects $field = "$value"', ({ field, value }) => {
    expect(
      projectFormSchema.safeParse({ ...validProject, [field]: value }).success,
    ).toBe(false);
  });
});

describe('projectGoalsFormSchema', () => {
  it('turns blank descriptions into null', () => {
    expect(
      projectGoalsFormSchema.parse({
        goals: [
          { goal: 'AGILITY', description: '  ', progress: 10 },
          { goal: 'DELIGHT', description: 'Smile', progress: 0 },
        ],
      }),
    ).toEqual({
      goals: [
        { goal: 'AGILITY', description: null, progress: 10 },
        { goal: 'DELIGHT', description: 'Smile', progress: 0 },
      ],
    });
  });

  it.each([-1, 101, 2.5])('rejects progress %s', (progress) => {
    expect(
      projectGoalsFormSchema.safeParse({
        goals: [{ goal: 'AGILITY', description: null, progress }],
      }).success,
    ).toBe(false);
  });
});
