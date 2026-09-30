import 'package:flutter/material.dart';

class CustomerDashboardView extends StatelessWidget {
  const CustomerDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jewellery Store'),
      ),
      body: const Center(
        child: Text('Customer Dashboard / Catalog Placeholder'),
      ),
    );
  }
}
