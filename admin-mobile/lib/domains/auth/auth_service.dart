import 'package:shared_api_client/shared_api_client.dart';

/// Service adapter for Admin Auth relying on shared_api_client
class AdminAuthService {
  final AuthApi authApi;
  final TokenStorage tokenStorage;

  AdminAuthService({
    required this.authApi,
    required this.tokenStorage,
  });
}
