import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RoleIcon from './RoleIcon';

afterEach(cleanup);

const custom = { id: 'custom', name: 'Custom', team: 'townsfolk' as const, image: ['https://example.com/good.svg', 'https://example.com/evil.svg'] };

describe('RoleIcon', () => {
  it('tries the bundled icon before the custom image, then hides a failed fallback', () => {
    render(<RoleIcon role={custom} />);
    const icon = screen.getByRole('img', { name: 'Custom' });
    expect(icon).toHaveAttribute('src', '/icons/custom.svg');
    fireEvent.error(icon);
    expect(icon).toHaveAttribute('src', custom.image[0]);
    fireEvent.error(icon);
    expect(icon).not.toBeVisible();
  });

  it('infers evil alignment and lets callers override it', () => {
    const { rerender } = render(<RoleIcon role={{ ...custom, team: 'demon' }} />);
    fireEvent.error(screen.getByRole('img', { name: 'Custom' }));
    expect(screen.getByRole('img', { name: 'Custom' })).toHaveAttribute('src', custom.image[1]);
    rerender(<RoleIcon role={{ ...custom, team: 'demon' }} isEvil={false} />);
    fireEvent.error(screen.getByRole('img', { name: 'Custom' }));
    expect(screen.getByRole('img', { name: 'Custom' })).toHaveAttribute('src', custom.image[0]);
  });

  it('uses a single custom image for either alignment', () => {
    render(<RoleIcon role={{ ...custom, image: [custom.image[0]] }} isEvil />);
    const icon = screen.getByRole('img', { name: 'Custom' });
    fireEvent.error(icon);
    expect(icon).toHaveAttribute('src', custom.image[0]);
  });

  it('does not try unhostable local image URLs', () => {
    render(<RoleIcon role={{ ...custom, image: ['file:///private/custom.svg'] }} />);
    const icon = screen.getByRole('img', { name: 'Custom' });
    fireEvent.error(icon);
    expect(icon).toHaveAttribute('src', '/icons/custom.svg');
    expect(icon).not.toBeVisible();
  });

  it('restores a visible local icon when a failed character is replaced', () => {
    const { rerender } = render(<RoleIcon role={{ id: 'missing', name: 'Missing' }} />);
    fireEvent.error(screen.getByRole('img', { name: 'Missing' }));
    expect(screen.getByAltText('Missing')).not.toBeVisible();
    rerender(<RoleIcon role={{ id: 'chef', name: 'Chef' }} />);
    expect(screen.getByRole('img', { name: 'Chef' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Chef' })).toHaveAttribute('src', '/icons/chef.svg');
  });
});
