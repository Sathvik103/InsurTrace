import os
import pytest

# Ensure test environment has mock keys for secure initialization
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key-for-unit-testing-purposes-only")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-min-32-chars-long-strictly-for-testing")
