import 'package:flutter_test/flutter_test.dart';
import 'package:shared_api_client/shared_api_client.dart';

void main() {
  test('UserModel deserialization test', () {
    final userJson = {
      'id': '123',
      'email': 'test@example.com',
      'fullName': 'Test User',
      'role': 'customer',
    };

    final user = UserModel.fromJson(userJson);
    expect(user.id, '123');
    expect(user.email, 'test@example.com');
    expect(user.role, 'customer');
  });
}
