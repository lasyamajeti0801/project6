import pytest
import numpy as np
import pandas as pd
from decimal import Decimal
from apps.forecasting.engine import DemandForecastingEngine


def test_forecast_engine_initialization():
    """Verify forecasting engine initializes with product and warehouse."""
    engine = DemandForecastingEngine(product=None, warehouse=None)
    assert engine is not None
    assert engine.product is None
    assert engine.warehouse is None


def test_moving_average_math():
    """Verify moving average mathematics using pandas series."""
    series = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    rolling_3 = series.rolling(window=3).mean()
    assert rolling_3.iloc[-1] == 40.0  # (30 + 40 + 50) / 3


def test_exponential_smoothing_alpha():
    """Verify single exponential smoothing formula."""
    series = pd.Series([100.0, 110.0, 120.0])
    alpha = 0.3
    forecast = series.ewm(alpha=alpha, adjust=False).mean()
    assert forecast.iloc[-1] > 100.0
