import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

const firebaseDatabaseUrl =
    'https://cbcapp-mgh-default-rtdb.firebaseio.com/blood_bank.json';

const List<Map<String, dynamic>> bloodSections = [
  {
    'title': 'كرات الدم (RBCs)',
    'items': [
      {'key': 'rbc_ap', 'label': '+A'},
      {'key': 'rbc_am', 'label': '-A'},
      {'key': 'rbc_bp', 'label': '+B'},
      {'key': 'rbc_bm', 'label': '-B'},
      {'key': 'rbc_abp', 'label': '+AB'},
      {'key': 'rbc_abm', 'label': '-AB'},
      {'key': 'rbc_op', 'label': '+O'},
      {'key': 'rbc_om', 'label': '-O'},
    ],
  },
  {
    'title': 'البلازما (Plasma)',
    'items': [
      {'key': 'plasma_ap', 'label': 'A'},
      {'key': 'plasma_bp', 'label': 'B'},
      {'key': 'plasma_abp', 'label': 'AB'},
      {'key': 'plasma_op', 'label': 'O'},
    ],
  },
  {
    'title': 'الصفائح (Platelets)',
    'items': [
      {'key': 'plat_ap', 'label': '+A'},
      {'key': 'plat_am', 'label': '-A'},
      {'key': 'plat_bp', 'label': '+B'},
      {'key': 'plat_bm', 'label': '-B'},
      {'key': 'plat_abp', 'label': '+AB'},
      {'key': 'plat_abm', 'label': '-AB'},
      {'key': 'plat_op', 'label': '+O'},
      {'key': 'plat_om', 'label': '-O'},
    ],
  },
  {
    'title': 'الأجزاء (Parts)',
    'items': [
      {'key': 'part_ap', 'label': '+A'},
      {'key': 'part_am', 'label': '-A'},
      {'key': 'part_bp', 'label': '+B'},
      {'key': 'part_bm', 'label': '-B'},
      {'key': 'part_abp', 'label': '+AB'},
      {'key': 'part_abm', 'label': '-AB'},
      {'key': 'part_op', 'label': '+O'},
      {'key': 'part_om', 'label': '-O'},
    ],
  },
];

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  tz.initializeTimeZones();

  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );
  await flutterLocalNotificationsPlugin.initialize(
    settings: initializationSettings,
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'بنك الدم',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
        useMaterial3: true,
      ),
      home: const BloodBankPage(),
    );
  }
}

class BloodBankPage extends StatefulWidget {
  const BloodBankPage({super.key});

  @override
  State<BloodBankPage> createState() => _BloodBankPageState();
}

class _BloodBankPageState extends State<BloodBankPage> {
  final Map<String, TextEditingController> _controllers = {};
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _showSummary = false;

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _loadSavedValues();
    _loadRemoteValues();
    _requestPermissions();
    _scheduleDailyNotifications();
  }

  void _initializeControllers() {
    for (final section in bloodSections) {
      for (final item in section['items'] as List<Map<String, String>>) {
        _controllers[item['key']!] = TextEditingController(text: '0');
      }
    }
  }

  Future<void> _loadSavedValues() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      for (final key in _controllers.keys) {
        final storedValue = prefs.getInt(key);
        _controllers[key]!.text = storedValue?.toString() ?? '0';
      }
    });
  }

  Future<void> _saveValues() async {
    final prefs = await SharedPreferences.getInstance();
    final updates = <String, int>{};

    for (final entry in _controllers.entries) {
      final value = int.tryParse(entry.value.text) ?? 0;
      await prefs.setInt(entry.key, value);
      updates[entry.key] = value;
    }

    final success = await _saveRemoteValues(updates);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'تم حفظ البيانات بنجاح وفي نفس قاعدة البيانات.'
                : 'تم حفظ البيانات محلياً، لكن فشل مزامنة الإنترنت.',
          ),
        ),
      );
    }
  }

  Future<void> _loadRemoteValues() async {
    try {
      final response = await http.get(Uri.parse(firebaseDatabaseUrl));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>?;
        if (data != null) {
          setState(() {
            for (final entry in data.entries) {
              final key = entry.key;
              final value = int.tryParse(entry.value.toString()) ?? 0;
              if (_controllers.containsKey(key)) {
                _controllers[key]!.text = value.toString();
              }
            }
          });
          await _saveLocalValues();
        }
      }
    } catch (_) {
      // ignore network errors; local cache still works
    }
  }

  Future<bool> _saveRemoteValues(Map<String, int> updates) async {
    try {
      final response = await http.patch(
        Uri.parse(firebaseDatabaseUrl),
        body: jsonEncode(updates),
        headers: {'Content-Type': 'application/json'},
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveLocalValues() async {
    final prefs = await SharedPreferences.getInstance();
    for (final entry in _controllers.entries) {
      final value = int.tryParse(entry.value.text) ?? 0;
      await prefs.setInt(entry.key, value);
    }
  }

  Future<void> _requestPermissions() async {
    final androidImplementation = flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidImplementation?.requestNotificationsPermission();
    await androidImplementation?.requestExactAlarmsPermission();
  }

  Future<void> _showNotification({
    required String title,
    required String body,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'blood_bank_channel',
      'Blood Bank Notifications',
      channelDescription: 'إشعارات بنك الدم المحلية',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );
    const notificationDetails = NotificationDetails(android: androidDetails);
    await flutterLocalNotificationsPlugin.show(
      id: 0,
      title: title,
      body: body,
      notificationDetails: notificationDetails,
    );
  }

  Future<void> _scheduleDailyNotification(
    int id,
    int hour,
    int minute,
    String title,
    String body,
  ) async {
    final scheduledDate = _nextInstanceOfTime(hour, minute);
    const androidDetails = AndroidNotificationDetails(
      'blood_bank_channel',
      'Blood Bank Notifications',
      channelDescription: 'إشعارات بنك الدم المحلية',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );
    const notificationDetails = NotificationDetails(android: androidDetails);

    await flutterLocalNotificationsPlugin.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: scheduledDate,
      notificationDetails: notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }
    return scheduled;
  }

  void _scheduleDailyNotifications() {
    _scheduleDailyNotification(
      1,
      7,
      0,
      '⏰ تحديث رصيد بنك الدم',
      'تذكير صباحي: افحص رصيد الدم الآن.',
    );
    _scheduleDailyNotification(
      2,
      19,
      0,
      '⏰ تحديث رصيد بنك الدم',
      'تذكير مسائي: راجع رصيد الدم قبل نهاية اليوم.',
    );
  }

  void _toggleSummary() {
    final values = _controllers.values.map(
      (controller) => int.tryParse(controller.text) ?? 0,
    );
    final hasData = values.any((value) => value > 0);
    if (!hasData) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('لا توجد بيانات لعرضها.')));
      return;
    }
    setState(() {
      _showSummary = true;
    });
  }

  Future<void> _shareSummaryImage() async {
    final imageBytes = await _screenshotController.capture();
    if (imageBytes == null) return;

    final directory = await getTemporaryDirectory();
    final file = File('${directory.path}/blood_summary.png');
    await file.writeAsBytes(imageBytes);

    await Share.shareXFiles([XFile(file.path)], text: 'تقرير مكونات الدم');
  }

  void _hideSummary() {
    setState(() {
      _showSummary = false;
    });
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Widget _buildSection(Map<String, dynamic> section) {
    final items = section['items'] as List<Map<String, String>>;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              section['title'] as String,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: items.map((item) {
                final key = item['key']!;
                return SizedBox(
                  width: 130,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['label']!, textAlign: TextAlign.right),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _controllers[key],
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          border: const OutlineInputBorder(),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 10,
                            horizontal: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryView() {
    final rows = <TableRow>[];

    rows.add(
      const TableRow(
        decoration: BoxDecoration(color: Color(0xfff5f5f5)),
        children: [
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Text('المكون', textAlign: TextAlign.center),
          ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Text('الفصيلة', textAlign: TextAlign.center),
          ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Text('العدد', textAlign: TextAlign.center),
          ),
        ],
      ),
    );

    for (final section in bloodSections) {
      for (final item in section['items'] as List<Map<String, String>>) {
        final key = item['key']!;
        final value = int.tryParse(_controllers[key]!.text) ?? 0;
        if (value > 0 ||
            section['title'] == 'كرات الدم (RBCs)' &&
                ['rbc_ap', 'rbc_bp', 'rbc_abp', 'rbc_op'].contains(key)) {
          rows.add(
            TableRow(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    section['title'] as String,
                    textAlign: TextAlign.center,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(item['label']!, textAlign: TextAlign.center),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(value.toString(), textAlign: TextAlign.center),
                ),
              ],
            ),
          );
        }
      }
    }

    return Screenshot(
      controller: _screenshotController,
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: const [
                      Text(
                        'رصيد بنك الدم المتاح',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Table(
                border: TableBorder.all(color: Colors.grey.shade300),
                children: rows,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _shareSummaryImage,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                child: const Text('مشاركة عبر WhatsApp'),
              ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: _hideSummary,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[700],
                ),
                child: const Text('🔙 العودة للتعديل'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('بنك دم مستشفى برج العرب'),
        centerTitle: true,
      ),
      body: _showSummary
          ? _buildSummaryView()
          : ListView(
              padding: const EdgeInsets.only(bottom: 20),
              children: [
                Container(
                  margin: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: const Center(
                    child: Text(
                      'الوقت الحالي: تحديث تلقائي',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                ),
                ...bloodSections.map(_buildSection),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    children: [
                      ElevatedButton(
                        onPressed: _saveValues,
                        child: const Text('حفظ التعديلات'),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: _toggleSummary,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                        ),
                        child: const Text('التقاط صورة للجدول'),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: () => _showNotification(
                          title: 'تذكير بنك الدم',
                          body: 'افحص رصيد بنك الدم الآن.',
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                        ),
                        child: const Text('عرض إشعار الآن'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
