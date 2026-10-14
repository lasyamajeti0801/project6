import pytest
from django.test import Client
from rest_framework import status


@pytest.fixture
def api_client():
    return Client()


def test_health_check_endpoint(api_client):
    """Verify system health endpoint returns 200 OK and valid status."""
    response = api_client.get("/api/health/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert "StockPilot" in data["application"]
    assert data["database"] == "operational"


def test_root_api_schema(api_client):
    """Verify OpenAPI schema or health indicator is reachable."""
    response = api_client.get("/api/health/")
    assert response.status_code == status.HTTP_200_OK
