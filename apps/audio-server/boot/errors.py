class SetupError(Exception):
    """Base error"""
    pass

class WorkspaceConfigError(SetupError):
    """Raised when workspace.json has faulty or missing configurations"""
    pass

class VenvInitializationError(SetupError):
    """Raised when native venv module fails to create environment"""
    pass

class DenoInstallError(SetupError):
    """Raised when deno installation fails"""
    pass