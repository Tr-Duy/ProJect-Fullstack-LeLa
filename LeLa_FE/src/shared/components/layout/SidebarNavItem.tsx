import { NavLink } from 'react-router-dom';
import { Tooltip } from 'antd';
import type { NavItemConfig } from '../../config/navConfig';

interface Props {
  item: NavItemConfig;
  collapsed: boolean;
  count?: number;
  onClick?: () => void;
}

export function SidebarNavItem({ item, collapsed, count, onClick }: Props) {
  const Icon = item.icon;

  const content = (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={onClick}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `nav-item group relative flex h-10 items-center gap-3 rounded-[10px] text-sm select-none transition-all ${
          collapsed ? 'w-10 justify-center p-0 mx-auto' : 'px-3'
        } ${
          isActive
            ? 'bg-[#FFF0DC] text-[#2B1B0E] font-bold border border-black/15 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)]'
            : 'text-[var(--text-2)] font-medium hover:bg-[var(--hover)] hover:text-[var(--text)] border border-transparent'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-[20px] w-[3.5px] -translate-y-1/2 rounded-r-md bg-[var(--brand)] shadow-xs" />
          )}
          <Icon
            size={19}
            strokeWidth={isActive ? 2.25 : 1.75}
            className={`relative shrink-0 transition-colors ${
              isActive ? 'text-[var(--brand-700)]' : 'text-[var(--text-3)] group-hover:text-[var(--text)]'
            }`}
          />
          {!collapsed && (
            <span
              className={`relative flex-1 whitespace-nowrap text-left ${
                isActive ? 'font-bold text-[#2B1B0E]' : 'text-[var(--text-2)] group-hover:text-[var(--text)]'
              }`}
            >
              {item.label}
            </span>
          )}
          {!collapsed && item.badge && (
            <span className="relative rounded-md bg-[#E3F7F4] border border-black/30 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-[#0B7A6E] shadow-xs">
              {item.badge}
            </span>
          )}
          {!collapsed && typeof count === 'number' && count > 0 && (
            <span className="relative rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] px-2 py-0.5 text-[11px] font-black text-[var(--brand-700)]">
              {count}
            </span>
          )}
          {collapsed && item.badge && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#12A594] border border-black/40 ring-1 ring-white" />
          )}
          {collapsed && typeof count === 'number' && count > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--brand)] ring-2 ring-[var(--chrome)]" />
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip title={item.label} placement="right" mouseEnterDelay={0.3}>
        <div className="flex justify-center">{content}</div>
      </Tooltip>
    );
  }

  return content;
}
