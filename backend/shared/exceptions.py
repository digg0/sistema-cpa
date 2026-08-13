class DomainError(Exception):
    def __init__(self, message: str, code: str = "domain_error"):
        super().__init__(message)
        self.message = message
        self.code = code


class NotFoundError(DomainError):
    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(message, "not_found")


class ConflictError(DomainError):
    def __init__(self, message: str = "Conflito de regra de negócio"):
        super().__init__(message, "conflict")


class ForbiddenError(DomainError):
    def __init__(self, message: str = "Operação não permitida"):
        super().__init__(message, "forbidden")


class AuthenticationError(DomainError):
    def __init__(self, message: str = "Credenciais inválidas"):
        super().__init__(message, "unauthenticated")


class ValidationError(DomainError):
    def __init__(self, message: str = "Dados inválidos"):
        super().__init__(message, "validation_error")
