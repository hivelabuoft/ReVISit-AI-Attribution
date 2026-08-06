import { renderToStaticMarkup } from 'react-dom/server';
import {
  describe, expect, test, vi,
} from 'vitest';
import { DropdownResponse } from '../../parser/types';
import { DropdownInput } from './DropdownInput';

vi.mock('@mantine/core', () => ({
  MultiSelect: () => <div data-component="multi-select" />,
  Select: ({ searchable }: { searchable?: boolean }) => (
    <div data-component="select" data-searchable={String(Boolean(searchable))} />
  ),
}));

describe('DropdownInput', () => {
  test('enables search for single-select dropdowns', () => {
    const response: DropdownResponse = {
      id: 'country-of-residence',
      prompt: 'In which country or region do you currently live?',
      required: true,
      location: 'aboveStimulus',
      type: 'dropdown',
      options: ['Canada', 'United States'],
    };

    const html = renderToStaticMarkup(
      <DropdownInput
        response={response}
        disabled={false}
        answer={{ value: '' }}
        index={0}
        enumerateQuestions={false}
      />,
    );

    expect(html).toContain('data-component="select"');
    expect(html).toContain('data-searchable="true"');
  });
});
