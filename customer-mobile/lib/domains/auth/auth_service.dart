import 'package:shared_api_client/shared_api_client.dart';

/// Service adapter for Customer Auth relying on shared_api_client
class CustomerAuthService {
  final AuthApi authApi;
  final TokenStorage tokenStorage;

  CustomerAuthService({
    required this.authApi,
    required this.tokenStorage,
  });
}
