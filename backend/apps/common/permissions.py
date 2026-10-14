from rest_framework import permissions

class HasRole(permissions.BasePermission):
    """
    Enforces role-based permissions against User.role.
    Allowed roles are defined as `allowed_roles` attribute on the ViewSet.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super admin has global bypass
        if request.user.is_superuser or getattr(request.user, 'role', '') == 'super_admin':
            return True
            
        allowed_roles = getattr(view, 'allowed_roles', None)
        if not allowed_roles:
            return True
            
        user_role = getattr(request.user, 'role', '')
        return user_role in allowed_roles


class IsOrgOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user_role = getattr(request.user, 'role', '')
        return request.user.is_superuser or user_role in ['super_admin', 'org_owner', 'warehouse_manager']
