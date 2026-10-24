import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CustomDateTimePicker from './CustomDateTimePicker';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(element));
  return { container, rerender: (el: React.ReactElement) => act(() => root.render(el)), unmount: () => act(() => root.unmount()) };
}

const shown = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button[role="combobox"]')).map((b) => b.textContent);

describe('CustomDateTimePicker', () => {
  it('keeps an existing day-first value instead of replacing it with today', () => {
    const onChange = vi.fn();
    const { container, unmount } = mount(<CustomDateTimePicker value="15/03/1990" format="DD/MM/YYYY" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    expect(shown(container)).toEqual(['1990', 'March', '15']);
    unmount();
  });

  it('shows month-name values like "18 Sept 2025, 14:55 pm"', () => {
    const onChange = vi.fn();
    const { container, unmount } = mount(
      <CustomDateTimePicker value="18 Sept 2025, 14:55 pm" format="D_MMM_YYYY__HH:mm" onChange={onChange} />
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(shown(container)).toEqual(['2025', 'September', '18', '14', '55']);
    unmount();
  });

  it('fills an empty field once with a formatted date', () => {
    const onChange = vi.fn();
    const { unmount } = mount(<CustomDateTimePicker value="" format="DD MMM YYYY" sample="01 JAN 2020" onChange={onChange} />);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatch(/^\d{2} [A-Z]{3} \d{4}$/);
    unmount();
  });

  it('follows a value set from outside after mount (duplicate / dependency)', () => {
    const onChange = vi.fn();
    const { container, rerender, unmount } = mount(<CustomDateTimePicker value="01/01/2000" format="DD/MM/YYYY" onChange={onChange} />);
    rerender(<CustomDateTimePicker value="24/12/1985" format="DD/MM/YYYY" onChange={onChange} />);
    expect(shown(container)).toEqual(['1985', 'December', '24']);
    expect(onChange).not.toHaveBeenCalled();
    unmount();
  });

  it('re-fills when the value is cleared from outside instead of showing a stale date', () => {
    const onChange = vi.fn();
    const { container, rerender, unmount } = mount(<CustomDateTimePicker value="24/12/1985" format="DD/MM/YYYY" onChange={onChange} />);
    rerender(<CustomDateTimePicker value="" format="DD/MM/YYYY" onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith('24/12/1985');
    expect(shown(container)).toEqual(['1985', 'December', '24']);
    unmount();
  });

  it('lists years far enough back for birth dates', () => {
    const { container, unmount } = mount(<CustomDateTimePicker value="02/02/1931" format="DD/MM/YYYY" onChange={() => {}} />);
    expect(shown(container)[0]).toBe('1931');
    unmount();
  });
});
