import pytest
from apps.accounts.models import User


def test_ten_rbac_roles_defined():
    """Verify system defines all 10 statutory warehouse roles."""
    expected_roles = {
        'super_admin',
        'org_owner',
        'warehouse_manager',
        'inventory_manager',
        'procurement_officer',
        'sales_manager',
        'dispatch_operator',
        'stock_auditor',
        'finance_viewer',
        'read_only',
    }
    actual_roles = {choice[0] for choice in User.ROLE_CHOICES}
    assert expected_roles.issubset(actual_roles)
    assert len(User.ROLE_CHOICES) == 10
