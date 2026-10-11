import csv
import io
import json
import urllib.request
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

DASHBOARDS = {
    "Medium reservoirs": "9b114013dce14faca2c6bf8de3de6d3f",
    "Major reservoirs": "97be51156fa84712851286408eb09c45",
}
ITEM_DATA_URL = "https://www.arcgis.com/sharing/rest/content/items/{}/data?f=json"
ARCGIS_ITEM_DATA_URL = (
    "https://slirrigation.maps.arcgis.com/sharing/rest/content/items/{}/data?f=json"
)


def fetch_json(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read().decode("utf-8-sig"))
    if "error" in data:
        raise RuntimeError(f"ArcGIS request failed: {data['error']}")
    return data


def iter_layers(layers):
    for layer in layers:
        yield layer
        yield from iter_layers(layer.get("layers", []))


def discover_csv_url(dashboard_id):
    dashboard = fetch_json(ITEM_DATA_URL.format(dashboard_id))
    widgets = dashboard.get("desktopView", {}).get("widgets", [])
    data_source = None
    for widget in widgets:
        if widget.get("type") != "listWidget":
            continue
        for dataset in widget.get("datasets", []):
            source = dataset.get("dataSource", {})
            fields = dataset.get("outFields", [])
            if (
                source.get("type") == "layerDataSource"
                and not dataset.get("filter")
                and ("*" in fields or any(field.casefold() == "reservoir" for field in fields))
            ):
                data_source = source
                break
        if data_source:
            break

    if not data_source:
        raise ValueError(f"No reservoir data layer found in dashboard {dashboard_id}.")

    web_map = fetch_json(ARCGIS_ITEM_DATA_URL.format(data_source["itemId"]))
    layer = next(
        (
            layer for layer in iter_layers(web_map.get("operationalLayers", []))
            if layer.get("id") == data_source["layerId"]
        ),
        None,
    )
    if not layer or not layer.get("url"):
        raise ValueError(f"Could not resolve the CSV layer for dashboard {dashboard_id}.")

    parts = urlsplit(layer["url"])
    query = dict(parse_qsl(parts.query))
    query.update(layer.get("customParameters", {}))
    query.setdefault("output", "csv")
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def get_all_reservoir_data(csv_url):
    request = urllib.request.Request(csv_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        content = response.read().decode("utf-8-sig")

    csv_rows = list(csv.reader(io.StringIO(content)))
    header_index = next(
        (
            index for index, row in enumerate(csv_rows)
            if any(cell.strip().casefold() == "reservoir" for cell in row)
        ),
        None,
    )
    if header_index is None:
        raise ValueError("Could not find the Reservoir column in the downloaded CSV.")

    headers = [header.strip() for header in csv_rows[header_index]]
    return [
        dict(zip(headers, row))
        for row in csv_rows[header_index + 1:]
        if any(cell.strip() for cell in row)
    ]


def get_reservoir_data(name, rows):
    target = name.strip().casefold()
    reservoir_field = next(
        (
            field for field in rows[0]
            if field.strip().casefold() == "reservoir"
        ),
        None,
    ) if rows else None
    if reservoir_field is None:
        return []

    return [
        row for row in rows
        if (row.get(reservoir_field) or "").strip().casefold() == target
    ]


def main():
    name = input("Enter a reservoir name: ").strip()
    if not name:
        print("Please enter a reservoir name.")
        return

    found = False
    available_names = set()
    for dashboard_name, dashboard_id in DASHBOARDS.items():
        csv_url = discover_csv_url(dashboard_id)
        rows = get_all_reservoir_data(csv_url)
        matches = get_reservoir_data(name, rows)
        available_names.update(
            value.strip()
            for row in rows
            for field, value in row.items()
            if field.strip().casefold() == "reservoir" and value.strip()
        )
        if not matches:
            continue

        found = True
        print(f"\n{dashboard_name}:")
        for index, row in enumerate(matches, start=1):
            if len(matches) > 1:
                print(f"\nRecord {index}:")
            for field, value in row.items():
                if not field.strip() or field.strip().casefold() in {
                    "no", "remarks", "__objectid", "objectid",
                }:
                    continue
                print(f"{field}: {value}")

    if not found:
        print(f"No reservoir found with the name {name!r}.")
        print("Available reservoirs:")
        print(", ".join(sorted(available_names)))


if __name__ == "__main__":
    main()